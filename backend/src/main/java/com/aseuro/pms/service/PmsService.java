package com.aseuro.pms.service;

import com.aseuro.pms.dto.*;
import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PmsService {

    private final EmployeeRepository employeeRepository;
    private final PmsAssignmentRepository pmsAssignmentRepository;
    private final PmsKpiRepository pmsKpiRepository;
    private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
    private final EmployeeReviewRepository employeeReviewRepository;
    private final FinalPmsResultRepository finalPmsResultRepository;
    private final PmsHistoryRepository pmsHistoryRepository;
    private final KpiMasterRepository kpiMasterRepository;

    public PmsService(
            EmployeeRepository employeeRepository,
            PmsAssignmentRepository pmsAssignmentRepository,
            PmsKpiRepository pmsKpiRepository,
            EmployeeKpiRatingRepository employeeKpiRatingRepository,
            EmployeeReviewRepository employeeReviewRepository,
            FinalPmsResultRepository finalPmsResultRepository,
            PmsHistoryRepository pmsHistoryRepository,
            KpiMasterRepository kpiMasterRepository) {
        this.employeeRepository = employeeRepository;
        this.pmsAssignmentRepository = pmsAssignmentRepository;
        this.pmsKpiRepository = pmsKpiRepository;
        this.employeeKpiRatingRepository = employeeKpiRatingRepository;
        this.employeeReviewRepository = employeeReviewRepository;
        this.finalPmsResultRepository = finalPmsResultRepository;
        this.pmsHistoryRepository = pmsHistoryRepository;
        this.kpiMasterRepository = kpiMasterRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        Optional<PmsAssignment> currentAssignmentOpt = pmsAssignmentRepository
                .findFirstByEmployeeOrderByStartDateDesc(employee);

        if (currentAssignmentOpt.isEmpty()) {
            return DashboardResponse.builder()
                    .currentCycle("N/A")
                    .pmsStatus("PMS_NOT_STARTED")
                    .totalKpis(0)
                    .completedKpis(0)
                    .completedWeightage(0.0)
                    .actionRequired("No active PMS cycle assigned to you.")
                    .build();
        }

        PmsAssignment assignment = currentAssignmentOpt.get();
        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);

        int totalKpis = kpis.size();
        int completedKpis = 0;
        double completedWeightage = 0.0;

        for (EmployeeKpiRating rating : ratings) {
            if (rating.getSelfRating() != null) {
                completedKpis++;
                // Find matching KPI weightage
                Optional<PmsKpi> matchedKpi = kpis.stream().filter(k -> k.getId().equals(rating.getKpi().getId()))
                        .findFirst();
                if (matchedKpi.isPresent()) {
                    completedWeightage += matchedKpi.get().getWeightage();
                }
            }
        }

        // Get latest finalized score from history
        List<PmsHistory> history = pmsHistoryRepository.findByEmployeeOrderByCycleMonthDesc(employee);
        Double latestScore = null;
        String latestGrade = null;
        if (!history.isEmpty()) {
            PmsHistory lastHist = history.get(0);
            latestScore = lastHist.getFinalScore();
            latestGrade = lastHist.getGrade();
        }

        String managerReviewStatus = "Pending";
        String hrReviewStatus = "Pending";
        String actionRequired = "No action required.";

        PMSState state = assignment.getStatus();
        if (state == PMSState.PMS_STARTED || state == PMSState.SELF_ASSESSMENT_DRAFT) {
            actionRequired = "Please complete and submit your self-assessment.";
        } else if (state == PMSState.SELF_ASSESSMENT_SUBMITTED || state == PMSState.MANAGER_REVIEW_PENDING) {
            actionRequired = "No action required. Self-assessment submitted. Awaiting manager review.";
        } else if (state == PMSState.MANAGER_REVIEW_SUBMITTED || state == PMSState.HR_REVIEW_PENDING) {
            managerReviewStatus = "Completed";
            actionRequired = "Awaiting HR review and final publishing.";
        } else if (state == PMSState.HR_REVIEW_COMPLETED || state == PMSState.FINAL_RESULT_PUBLISHED
                || state == PMSState.COMPLETED) {
            managerReviewStatus = "Completed";
            hrReviewStatus = "Completed";
            actionRequired = "PMS completed. You can view your finalized results in History / Reports.";
        }

        return DashboardResponse.builder()
                .currentCycle(assignment.getCycleMonth())
                .pmsStatus(state.name())
                .totalKpis(totalKpis)
                .completedKpis(completedKpis)
                .completedWeightage(completedWeightage)
                .latestFinalizedScore(latestScore)
                .latestFinalizedGrade(latestGrade)
                .managerReviewStatus(managerReviewStatus)
                .hrReviewStatus(hrReviewStatus)
                .actionRequired(actionRequired)
                .build();
    }

    @Transactional
    public PmsAssignmentDto getCurrentAssignment(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        Optional<PmsAssignment> assignmentOpt = pmsAssignmentRepository.findFirstByEmployeeOrderByStartDateDesc(employee);

        PmsAssignment assignment;
        if (assignmentOpt.isPresent()) {
            assignment = assignmentOpt.get();
        } else {
            // Auto-create active PMS cycle for this employee / manager
            LocalDate now = LocalDate.now();
            LocalDate start = now.withDayOfMonth(1);
            LocalDate end = start.plusMonths(1).minusDays(1);
            LocalDate deadline = start.plusDays(25);
            String monthName = start.format(java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy", java.util.Locale.ENGLISH));

            assignment = PmsAssignment.builder()
                    .employee(employee)
                    .cycleMonth(monthName)
                    .status(PMSState.SELF_ASSESSMENT_DRAFT)
                    .startDate(start)
                    .endDate(end)
                    .submissionDeadline(deadline)
                    .build();
            assignment = pmsAssignmentRepository.save(assignment);

            String designation = employee.getDesignation() != null ? employee.getDesignation().trim() : "Software Engineer";
            List<KpiMaster> masterKpis = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus(designation, "ACTIVE");
            if (masterKpis.isEmpty()) {
                masterKpis = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus("Software Engineer", "ACTIVE");
            }

            List<PmsKpi> assignedKpis = new ArrayList<>();
            for (KpiMaster km : masterKpis) {
                PmsKpi k = PmsKpi.builder()
                        .assignment(assignment)
                        .kpiName(km.getKpiName())
                        .description(km.getDescription())
                        .weightage(km.getWeightage())
                        .build();
                assignedKpis.add(k);
            }
            if (!assignedKpis.isEmpty()) {
                pmsKpiRepository.saveAll(assignedKpis);
            }
        }

        return getAssignmentDto(assignment);
    }

    @Transactional(readOnly = true)
    public PmsAssignmentDto getAssignmentDetail(Long employeeId, Long assignmentId) {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        Employee caller = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isOwner = assignment.getEmployee().getId().equals(employeeId);
        boolean isManager = assignment.getEmployee().getManager() != null && assignment.getEmployee().getManager().getId().equals(employeeId);
        boolean isHrOrAdmin = caller.getRole() == Role.ROLE_HR;
        boolean isCallerManager = caller.getRole() == Role.ROLE_MANAGER;

        if (!isOwner && !isManager && !isHrOrAdmin && !isCallerManager) {
            throw new AccessDeniedException("Unauthorized access to PMS records");
        }

        return getAssignmentDto(assignment);
    }

    @Transactional
    public PmsAssignmentDto saveSelfAssessmentDraft(Long employeeId, Long assignmentId, KpiRatingRequest request) {
        PmsAssignment assignment = getEditableAssignment(employeeId, assignmentId);

        if (request.getRatings() != null) {
            for (KpiRatingRequest.KpiRatingEntry entry : request.getRatings()) {
                if (entry.getSelfRating() != null && (entry.getSelfRating() < 0.0 || entry.getSelfRating() > 5.0)) {
                    throw new IllegalArgumentException("Rating must be between 0.0 and 5.0");
                }
            }
        }

        updateRatings(assignment, request, "DRAFT");

        assignment.setStatus(PMSState.SELF_ASSESSMENT_DRAFT);
        pmsAssignmentRepository.save(assignment);

        return getAssignmentDto(assignment);
    }

    @Transactional
    public PmsAssignmentDto submitSelfAssessment(Long employeeId, Long assignmentId, KpiRatingRequest request) {
        PmsAssignment assignment = getEditableAssignment(employeeId, assignmentId);

        // Validate that all KPIs are rated
        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        if (request.getRatings() == null || request.getRatings().size() != kpis.size()) {
            throw new IllegalArgumentException("All KPIs must be rated for self-assessment submission.");
        }

        for (KpiRatingRequest.KpiRatingEntry entry : request.getRatings()) {
            if (entry.getSelfRating() == null) {
                throw new IllegalArgumentException("Rating is required for KPI ID " + entry.getKpiId());
            }
            if (entry.getSelfRating() < 0.0 || entry.getSelfRating() > 5.0) {
                throw new IllegalArgumentException("Rating must be between 0.0 and 5.0 for KPI ID " + entry.getKpiId());
            }
        }

        updateRatings(assignment, request, "SUBMITTED");

        assignment.setStatus(PMSState.SELF_ASSESSMENT_SUBMITTED);
        pmsAssignmentRepository.save(assignment);

        return getAssignmentDto(assignment);
    }

    @Transactional(readOnly = true)
    public List<PmsHistoryDto> getPmsHistory(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        List<PmsHistory> history = pmsHistoryRepository.findByEmployeeOrderByCycleMonthDesc(employee);

        return history.stream().map(h -> PmsHistoryDto.builder()
                .id(h.getId())
                .assignmentId(h.getAssignmentId())
                .cycleMonth(h.getCycleMonth())
                .finalScore(h.getFinalScore())
                .grade(h.getGrade())
                .finalizedDate(h.getFinalizedDate())
                .filePath(h.getFilePath())
                .build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PmsHistoryDto> getPmsHistoryForCaller(Long callerId, Long targetEmployeeId) {
        Long empId = callerId;
        if (targetEmployeeId != null) {
            Employee caller = employeeRepository.findById(callerId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            if (caller.getRole() == Role.ROLE_HR || caller.getRole() == Role.ROLE_MANAGER) {
                empId = targetEmployeeId;
            }
        }
        return getPmsHistory(empId);
    }

    // Helper methods
    private PmsAssignment getEditableAssignment(Long employeeId, Long assignmentId) {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found"));

        if (!assignment.getEmployee().getId().equals(employeeId)) {
            throw new AccessDeniedException("Unauthorized access to PMS records");
        }

        PMSState state = assignment.getStatus();
        if (state == PMSState.SELF_ASSESSMENT_SUBMITTED ||
                state == PMSState.MANAGER_REVIEW_PENDING ||
                state == PMSState.MANAGER_REVIEW_SUBMITTED ||
                state == PMSState.HR_REVIEW_PENDING ||
                state == PMSState.HR_REVIEW_COMPLETED ||
                state == PMSState.RATING_AND_POINTS_CALCULATED ||
                state == PMSState.FINAL_ANALYSIS ||
                state == PMSState.FINAL_RESULT_PUBLISHED ||
                state == PMSState.COMPLETED) {
            throw new IllegalArgumentException("PMS record is finalized or submitted and cannot be edited.");
        }

        return assignment;
    }

    private void updateRatings(PmsAssignment assignment, KpiRatingRequest request, String status) {
        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        Map<Long, PmsKpi> kpiMap = kpis.stream().collect(Collectors.toMap(PmsKpi::getId, k -> k));

        List<EmployeeKpiRating> existingRatings = employeeKpiRatingRepository.findByAssignment(assignment);
        Map<Long, EmployeeKpiRating> ratingMap = existingRatings.stream()
                .collect(Collectors.toMap(r -> r.getKpi().getId(), r -> r));

        if (request.getRatings() != null) {
            for (KpiRatingRequest.KpiRatingEntry entry : request.getRatings()) {
                PmsKpi kpi = kpiMap.get(entry.getKpiId());
                if (kpi == null) {
                    throw new IllegalArgumentException("Invalid KPI ID " + entry.getKpiId() + " for this assignment");
                }

                if (entry.getSelfRating() != null && (entry.getSelfRating() < 0.0 || entry.getSelfRating() > 5.0)) {
                    throw new IllegalArgumentException("Rating must be between 0.0 and 5.0");
                }

                EmployeeKpiRating rating = ratingMap.get(entry.getKpiId());
                if (rating == null) {
                    rating = EmployeeKpiRating.builder()
                            .assignment(assignment)
                            .kpi(kpi)
                            .build();
                }

                rating.setSelfRating(entry.getSelfRating());
                rating.setComments(entry.getComments());
                rating.setStatus(status);

                employeeKpiRatingRepository.save(rating);
            }
        }
    }

    private PmsAssignmentDto getAssignmentDto(PmsAssignment assignment) {
        Employee emp = assignment.getEmployee();
        EmployeeDto empDto = EmployeeDto.builder()
                .id(emp.getId())
                .name(emp.getName())
                .email(emp.getEmail())
                .department(emp.getDepartment())
                .team(emp.getTeam())
                .designation(emp.getDesignation())
                .managerName(emp.getManager() != null ? emp.getManager().getName() : "N/A")
                .joiningDate(emp.getJoiningDate())
                .accountStatus(emp.getAccountStatus())
                .build();

        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);
        Map<Long, EmployeeKpiRating> ratingMap = ratings.stream()
                .collect(Collectors.toMap(r -> r.getKpi().getId(), r -> r, (r1, r2) -> r1));

        List<KpiDto> kpiDtos = kpis.stream().map(k -> {
            EmployeeKpiRating r = ratingMap.get(k.getId());
            Double effectiveHrRating = r != null ? r.getHrRating() : null;
            if (effectiveHrRating == null && (assignment.getStatus() == PMSState.COMPLETED || assignment.getStatus() == PMSState.FINAL_RESULT_PUBLISHED)) {
                if (r != null && r.getManagerRating() != null) effectiveHrRating = r.getManagerRating();
                else if (r != null && r.getSelfRating() != null) effectiveHrRating = r.getSelfRating();
                else if (assignment.getOverallScore() != null) effectiveHrRating = assignment.getOverallScore();
            }
            return KpiDto.builder()
                    .kpiId(k.getId())
                    .kpiName(k.getKpiName())
                    .description(k.getDescription())
                    .weightage(k.getWeightage())
                    .selfRating(r != null ? r.getSelfRating() : null)
                    .managerRating(r != null ? r.getManagerRating() : null)
                    .hrRating(effectiveHrRating)
                    .comments(r != null ? r.getComments() : null)
                    .managerComments(r != null ? r.getManagerComments() : null)
                    .hrComments(r != null ? r.getHrComments() : null)
                    .ratingStatus(r != null ? r.getStatus() : "PENDING")
                    .build();
        }).collect(Collectors.toList());

        List<EmployeeReview> reviews = employeeReviewRepository.findByAssignment(assignment);
        List<ReviewDto> reviewDtos = reviews.stream().map(r -> ReviewDto.builder()
                .reviewerName(r.getReviewer().getName())
                .reviewerRole(r.getReviewer().getRole().name().replace("ROLE_", ""))
                .comments(r.getComments())
                .reviewDate(r.getReviewDate())
                .build()).collect(Collectors.toList());

        return PmsAssignmentDto.builder()
                .assignmentId(assignment.getId())
                .cycleMonth(assignment.getCycleMonth())
                .status(assignment.getStatus().name())
                .startDate(assignment.getStartDate())
                .endDate(assignment.getEndDate())
                .submissionDeadline(assignment.getSubmissionDeadline())
                .overallScore(assignment.getOverallScore())
                .performanceGrade(assignment.getPerformanceGrade())
                .finalizedDate(assignment.getFinalizedDate())
                .employee(empDto)
                .kpis(kpiDtos)
                .reviews(reviewDtos)
                .build();
    }

    @Transactional
    public void resetActiveCycle(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        List<PmsAssignment> assignments = pmsAssignmentRepository.findByEmployee(employee);
        for (PmsAssignment assignment : assignments) {
            if ("August 2026".equals(assignment.getCycleMonth())) {
                assignment.setStatus(PMSState.SELF_ASSESSMENT_DRAFT);
                assignment.setOverallScore(null);
                assignment.setPerformanceGrade(null);
                assignment.setFinalizedDate(null);
                pmsAssignmentRepository.save(assignment);

                List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);
                if (!ratings.isEmpty()) {
                    employeeKpiRatingRepository.deleteAll(ratings);
                }
            }
        }
    }
}
