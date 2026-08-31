package com.aseuro.pms.service;

import com.aseuro.pms.dto.*;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ManagerService {

    private final EmployeeRepository employeeRepository;
    private final PmsAssignmentRepository pmsAssignmentRepository;
    private final PmsKpiRepository pmsKpiRepository;
    private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
    private final EmployeeReviewRepository employeeReviewRepository;
    private final PmsHistoryRepository pmsHistoryRepository;

    public ManagerService(
            EmployeeRepository employeeRepository,
            PmsAssignmentRepository pmsAssignmentRepository,
            PmsKpiRepository pmsKpiRepository,
            EmployeeKpiRatingRepository employeeKpiRatingRepository,
            EmployeeReviewRepository employeeReviewRepository,
            PmsHistoryRepository pmsHistoryRepository) {
        this.employeeRepository = employeeRepository;
        this.pmsAssignmentRepository = pmsAssignmentRepository;
        this.pmsKpiRepository = pmsKpiRepository;
        this.employeeKpiRatingRepository = employeeKpiRatingRepository;
        this.employeeReviewRepository = employeeReviewRepository;
        this.pmsHistoryRepository = pmsHistoryRepository;
    }

    @Transactional(readOnly = true)
    public ManagerDashboardDto getDashboardData(Long managerId) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Manager not found"));

        List<Employee> assignedEmployees = employeeRepository.findByManagerId(managerId);

        long pendingReviews = 0;
        long completedReviews = 0;

        for (Employee emp : assignedEmployees) {
            Optional<PmsAssignment> assignmentOpt = pmsAssignmentRepository.findFirstByEmployeeOrderByStartDateDesc(emp);
            if (assignmentOpt.isPresent()) {
                PMSState st = assignmentOpt.get().getStatus();
                if (st == PMSState.SELF_ASSESSMENT_SUBMITTED || st == PMSState.MANAGER_REVIEW_PENDING) {
                    pendingReviews++;
                } else if (st == PMSState.MANAGER_REVIEW_SUBMITTED || st == PMSState.HR_REVIEW_PENDING ||
                           st == PMSState.HR_REVIEW_COMPLETED || st == PMSState.FINAL_RESULT_PUBLISHED ||
                           st == PMSState.COMPLETED) {
                    completedReviews++;
                }
            }
        }

        // Manager's own active assignment
        Optional<PmsAssignment> managerAssignmentOpt = pmsAssignmentRepository.findFirstByEmployeeOrderByStartDateDesc(manager);

        String currentCycle = "August 2026";
        String selfStatus = "PMS_NOT_STARTED";
        PMSState currentState = PMSState.SELF_ASSESSMENT_DRAFT;

        Double latestScore = null;
        String latestGrade = "Pending HR Finalization";

        if (managerAssignmentOpt.isPresent()) {
            PmsAssignment ma = managerAssignmentOpt.get();
            currentCycle = ma.getCycleMonth() != null ? ma.getCycleMonth() : "August 2026";
            selfStatus = ma.getStatus().name();
            currentState = ma.getStatus();

            if (ma.getStatus() == PMSState.COMPLETED || ma.getStatus() == PMSState.FINAL_RESULT_PUBLISHED) {
                latestScore = ma.getOverallScore() != null ? ma.getOverallScore() : 0.00;
                latestGrade = ma.getPerformanceGrade() != null ? ma.getPerformanceGrade() : "Completed";
            } else {
                latestScore = 0.00;
                latestGrade = "Pending HR Finalization";
            }
        } else {
            latestScore = 0.00;
            latestGrade = "Pending HR Finalization";
        }

        // Dynamic Workflow Heading and Status according to PMS state
        String heading;
        String status;
        String subStatus;
        int activeStep;
        String actionRequired;

        // If manager has pending employee reviews, highlight Manager Review stage
        if (pendingReviews > 0) {
            heading = "MANAGER REVIEW";
            status = "Pending";
            subStatus = "Awaiting Manager Review (" + pendingReviews + " pending)";
            activeStep = 3;
            actionRequired = "You have " + pendingReviews + " assigned employee review(s) awaiting your evaluation.";
        } else if (currentState == PMSState.PMS_NOT_STARTED) {
            heading = "SELF ASSESSMENT";
            status = "Not Started";
            subStatus = "Waiting for Self Assessment";
            activeStep = 1;
            actionRequired = "Self assessment cycle is open. Please complete your KPIs.";
        } else if (currentState == PMSState.PMS_STARTED || currentState == PMSState.SELF_ASSESSMENT_DRAFT) {
            heading = "SELF ASSESSMENT";
            status = "In Progress";
            subStatus = "Draft in Progress";
            activeStep = 1;
            actionRequired = "Please complete and submit your self-assessment ratings.";
        } else if (currentState == PMSState.SELF_ASSESSMENT_SUBMITTED || currentState == PMSState.MANAGER_REVIEW_PENDING) {
            heading = "MANAGER REVIEW";
            status = "Pending";
            subStatus = "Awaiting Manager Review";
            activeStep = 3;
            actionRequired = "Self-assessment submitted. Awaiting manager review.";
        } else if (currentState == PMSState.MANAGER_REVIEW_SUBMITTED || currentState == PMSState.HR_REVIEW_PENDING) {
            heading = "HR REVIEW";
            status = "Pending";
            subStatus = "Awaiting HR Review";
            activeStep = 4;
            actionRequired = "Manager reviews completed. Awaiting HR final review and publishing.";
        } else if (currentState == PMSState.HR_REVIEW_COMPLETED || currentState == PMSState.FINAL_RESULT_PUBLISHED || currentState == PMSState.COMPLETED) {
            heading = "FINAL RESULT";
            status = "Completed";
            subStatus = "PMS Finalized";
            activeStep = 5;
            actionRequired = "PMS cycle finalized. Official reports available in Reports.";
        } else {
            heading = "MANAGER REVIEW";
            status = "In Progress";
            subStatus = "Operational Reviews";
            activeStep = 3;
            actionRequired = "Review assigned team members and manage performance.";
        }

        return ManagerDashboardDto.builder()
                .managerName(manager.getName())
                .currentCycle(currentCycle)
                .mySelfAssessmentStatus(selfStatus)
                .employeesAssigned(assignedEmployees.size())
                .pendingEmployeeReviews(pendingReviews)
                .completedEmployeeReviews(completedReviews)
                .latestFinalizedScore(latestScore)
                .latestFinalizedGrade(latestGrade)
                .workflowHeading(heading)
                .workflowStatus(status)
                .workflowSubStatus(subStatus)
                .activeStep(activeStep)
                .actionRequired(actionRequired)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ManagerEmployeeDto> getAssignedEmployees(Long managerId) {
        List<Employee> assigned = employeeRepository.findByManagerId(managerId);

        List<ManagerEmployeeDto> result = new ArrayList<>();
        for (Employee emp : assigned) {
            Optional<PmsAssignment> assignmentOpt = pmsAssignmentRepository.findFirstByEmployeeOrderByStartDateDesc(emp);

            Long assignmentId = null;
            String cycleMonth = "August 2026";
            String status = "PMS_NOT_STARTED";
            boolean canReview = false;
            Double overallScore = null;
            String performanceGrade = null;
            int totalKpis = 0;
            int completedKpis = 0;

            if (assignmentOpt.isPresent()) {
                PmsAssignment a = assignmentOpt.get();
                assignmentId = a.getId();
                cycleMonth = a.getCycleMonth();
                status = a.getStatus().name();
                overallScore = a.getOverallScore();
                performanceGrade = a.getPerformanceGrade();

                // Can review when employee has submitted self-assessment
                canReview = a.getStatus() == PMSState.SELF_ASSESSMENT_SUBMITTED ||
                            a.getStatus() == PMSState.MANAGER_REVIEW_PENDING;

                List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(a);
                totalKpis = kpis.size();
                List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(a);
                completedKpis = (int) ratings.stream().filter(r -> r.getSelfRating() != null).count();
            }

            result.add(ManagerEmployeeDto.builder()
                    .id(emp.getId())
                    .employeeCode("EMP-" + emp.getId())
                    .name(emp.getName())
                    .email(emp.getEmail())
                    .designation(emp.getDesignation() != null ? emp.getDesignation() : "-")
                    .department(emp.getDepartment() != null ? emp.getDepartment() : "Engineering")
                    .team(emp.getTeam() != null ? emp.getTeam() : "Core Platform")
                    .joiningDate(emp.getJoiningDate())
                    .accountStatus(emp.getAccountStatus() != null ? emp.getAccountStatus() : "ACTIVE")
                    .assignmentId(assignmentId)
                    .cycleMonth(cycleMonth)
                    .status(status)
                    .canReview(canReview)
                    .overallScore(overallScore)
                    .performanceGrade(performanceGrade)
                    .kpisCount(totalKpis)
                    .completedKpisCount(completedKpis)
                    .profilePhoto(emp.getProfilePhoto())
                    .build());
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEmployeeKpiReview(Long managerId, Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));

        if (employee.getManager() == null || !employee.getManager().getId().equals(managerId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Unauthorized: Employee is not assigned to you.");
        }

        PmsAssignment assignment = pmsAssignmentRepository.findFirstByEmployeeOrderByStartDateDesc(employee)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No active PMS cycle found for employee"));

        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);

        boolean canReview = assignment.getStatus() == PMSState.SELF_ASSESSMENT_SUBMITTED ||
                            assignment.getStatus() == PMSState.MANAGER_REVIEW_PENDING;

        boolean isCompleted = assignment.getStatus() == PMSState.COMPLETED ||
                              assignment.getStatus() == PMSState.FINAL_RESULT_PUBLISHED;

        List<Map<String, Object>> kpiDetails = new ArrayList<>();
        double selfWeightedSum = 0.0;
        double managerWeightedSum = 0.0;
        double totalWeight = 0.0;

        for (PmsKpi kpi : kpis) {
            EmployeeKpiRating r = ratings.stream()
                    .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                    .findFirst().orElse(null);

            Map<String, Object> item = new HashMap<>();
            item.put("kpiId", kpi.getId());
            item.put("kpiName", kpi.getKpiName());
            item.put("description", kpi.getDescription());
            item.put("weightage", kpi.getWeightage());
            item.put("selfRating", r != null ? r.getSelfRating() : null);
            item.put("employeeComments", r != null ? r.getComments() : null);
            item.put("managerRating", r != null ? r.getManagerRating() : null);
            item.put("managerComments", r != null ? r.getManagerComments() : null);
            item.put("hrRating", r != null ? r.getHrRating() : null);
            item.put("hrComments", r != null ? r.getHrComments() : null);

            if (r != null && r.getSelfRating() != null) {
                selfWeightedSum += r.getSelfRating() * (kpi.getWeightage() / 100.0);
            }
            if (r != null && r.getManagerRating() != null) {
                managerWeightedSum += r.getManagerRating() * (kpi.getWeightage() / 100.0);
            }
            totalWeight += kpi.getWeightage();

            kpiDetails.add(item);
        }

        // Get reviews
        List<EmployeeReview> reviews = employeeReviewRepository.findByAssignment(assignment);
        Optional<EmployeeReview> managerReview = reviews.stream()
                .filter(rev -> rev.getReviewer().getId().equals(managerId))
                .findFirst();

        Map<String, Object> response = new HashMap<>();
        response.put("employee", Map.of(
                "id", employee.getId(),
                "employeeCode", "EMP-" + employee.getId(),
                "name", employee.getName(),
                "email", employee.getEmail(),
                "designation", employee.getDesignation() != null ? employee.getDesignation() : "-",
                "department", employee.getDepartment() != null ? employee.getDepartment() : "Engineering",
                "managerName", employee.getManager() != null ? employee.getManager().getName() : "-",
                "profilePhoto", employee.getProfilePhoto() != null ? employee.getProfilePhoto() : ""
        ));
        response.put("assignmentId", assignment.getId());
        response.put("cycleMonth", assignment.getCycleMonth());
        response.put("status", assignment.getStatus().name());
        response.put("canReview", canReview);
        response.put("isCompleted", isCompleted);
        response.put("overallScore", assignment.getOverallScore());
        response.put("performanceGrade", assignment.getPerformanceGrade());
        response.put("kpis", kpiDetails);
        response.put("selfCalculatedScore", totalWeight > 0 ? Math.round(selfWeightedSum * 100.0) / 100.0 : null);
        response.put("managerCalculatedScore", totalWeight > 0 ? Math.round(managerWeightedSum * 100.0) / 100.0 : null);
        response.put("managerReviewComments", managerReview.map(EmployeeReview::getComments).orElse(""));

        return response;
    }

    @Transactional
    public Map<String, Object> submitManagerReview(Long managerId, Long assignmentId, ManagerReviewRequest request) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Manager not found"));

        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PMS Assignment not found"));

        if (assignment.getEmployee().getManager() == null || !assignment.getEmployee().getManager().getId().equals(managerId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Unauthorized: You are not the reporting manager for this employee.");
        }

        if (assignment.getStatus() == PMSState.COMPLETED || assignment.getStatus() == PMSState.FINAL_RESULT_PUBLISHED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PMS has already been finalized by HR and cannot be modified.");
        }

        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        if (request.getRatings() == null || request.getRatings().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Manager ratings cannot be empty.");
        }

        // Validate all ratings between 0.0 and 5.0
        for (ManagerReviewRequest.ManagerKpiRatingEntry entry : request.getRatings()) {
            if (entry.getManagerRating() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Rating is required for KPI ID " + entry.getKpiId());
            }
            if (entry.getManagerRating() < 0.0 || entry.getManagerRating() > 5.0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Rating must be between 0.0 and 5.0 for KPI ID " + entry.getKpiId());
            }
        }

        List<EmployeeKpiRating> existingRatings = employeeKpiRatingRepository.findByAssignment(assignment);

        for (ManagerReviewRequest.ManagerKpiRatingEntry entry : request.getRatings()) {
            PmsKpi matchedKpi = kpis.stream()
                    .filter(k -> k.getId().equals(entry.getKpiId()))
                    .findFirst()
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid KPI ID " + entry.getKpiId()));

            EmployeeKpiRating rating = existingRatings.stream()
                    .filter(r -> r.getKpi().getId().equals(entry.getKpiId()))
                    .findFirst()
                    .orElseGet(() -> EmployeeKpiRating.builder()
                            .assignment(assignment)
                            .kpi(matchedKpi)
                            .build());

            rating.setManagerRating(entry.getManagerRating());
            if (entry.getManagerComments() != null) {
                rating.setManagerComments(entry.getManagerComments());
            }
            rating.setStatus("MANAGER_REVIEWED");
            employeeKpiRatingRepository.save(rating);
        }

        // Save EmployeeReview record
        LocalDate today = LocalDate.now();
        EmployeeReview review = employeeReviewRepository.findByAssignment(assignment).stream()
                .filter(rev -> rev.getReviewer().getId().equals(managerId))
                .findFirst()
                .orElseGet(() -> EmployeeReview.builder()
                        .assignment(assignment)
                        .reviewer(manager)
                        .build());

        review.setComments(request.getManagerComments() != null ? request.getManagerComments().trim() : "Manager review completed.");
        review.setReviewDate(today);
        employeeReviewRepository.save(review);

        // Update PMS state to MANAGER_REVIEW_SUBMITTED / HR_REVIEW_PENDING
        assignment.setStatus(PMSState.MANAGER_REVIEW_SUBMITTED);
        pmsAssignmentRepository.save(assignment);

        return Map.of(
                "message", "Manager review submitted successfully.",
                "assignmentId", assignment.getId(),
                "status", "MANAGER_REVIEW_SUBMITTED"
        );
    }

    @Transactional(readOnly = true)
    public ManagerReportsDto getManagerReports(Long managerId) {
        List<ManagerEmployeeDto> assigned = getAssignedEmployees(managerId);

        long selfPending = 0;
        long selfCompleted = 0;
        long mgrPending = 0;
        long mgrCompleted = 0;
        long finalized = 0;

        for (ManagerEmployeeDto emp : assigned) {
            String st = emp.getStatus();
            if (st.equals("PMS_NOT_STARTED") || st.equals("PMS_STARTED") || st.equals("SELF_ASSESSMENT_DRAFT")) {
                selfPending++;
            } else {
                selfCompleted++;
            }

            if (st.equals("SELF_ASSESSMENT_SUBMITTED") || st.equals("MANAGER_REVIEW_PENDING")) {
                mgrPending++;
            } else if (st.equals("MANAGER_REVIEW_SUBMITTED") || st.equals("HR_REVIEW_PENDING") ||
                       st.equals("HR_REVIEW_COMPLETED") || st.equals("FINAL_RESULT_PUBLISHED") || st.equals("COMPLETED")) {
                mgrCompleted++;
            }

            if (st.equals("FINAL_RESULT_PUBLISHED") || st.equals("COMPLETED")) {
                finalized++;
            }
        }

        return ManagerReportsDto.builder()
                .assignedEmployees(assigned)
                .totalAssigned(assigned.size())
                .selfAssessmentPendingCount(selfPending)
                .selfAssessmentCompletedCount(selfCompleted)
                .managerReviewPendingCount(mgrPending)
                .managerReviewCompletedCount(mgrCompleted)
                .finalizedRecordsCount(finalized)
                .build();
    }
}
