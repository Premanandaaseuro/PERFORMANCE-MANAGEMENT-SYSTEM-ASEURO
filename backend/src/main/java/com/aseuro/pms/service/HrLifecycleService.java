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
public class HrLifecycleService {

    private final EmployeeRepository employeeRepository;
    private final PmsAssignmentRepository pmsAssignmentRepository;
    private final PmsKpiRepository pmsKpiRepository;
    private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
    private final EmployeeReviewRepository employeeReviewRepository;
    private final FinalPmsResultRepository finalPmsResultRepository;
    private final PmsHistoryRepository pmsHistoryRepository;
    private final KpiMasterRepository kpiMasterRepository;

    public HrLifecycleService(
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
    public List<EmployeeDto> searchEmployees(String query) {
        List<Employee> list = employeeRepository.findAll();
        if (query != null && !query.trim().isEmpty()) {
            String q = query.trim().toLowerCase();
            list = list.stream().filter(e ->
                    (e.getName() != null && e.getName().toLowerCase().contains(q)) ||
                    (e.getEmail() != null && e.getEmail().toLowerCase().contains(q)) ||
                    (e.getDesignation() != null && e.getDesignation().toLowerCase().contains(q)) ||
                    ("EMP-" + e.getId()).toLowerCase().contains(q)
            ).collect(Collectors.toList());
        }

        return list.stream().map(e -> {
            Optional<PmsAssignment> assignOpt = pmsAssignmentRepository.findFirstByEmployeeOrderByIdDesc(e);
            String pmsState = assignOpt.map(a -> a.getStatus().name()).orElse("SELF_ASSESSMENT_DRAFT");

            return EmployeeDto.builder()
                    .id(e.getId())
                    .employeeCode(e.getEmployeeCode() != null && !e.getEmployeeCode().isBlank() ? e.getEmployeeCode() : "EMP-" + e.getId())
                    .name(e.getName())
                    .email(e.getEmail())
                    .department(e.getDepartment() != null ? e.getDepartment() : "-")
                    .team(e.getTeam() != null ? e.getTeam() : "-")
                    .designation(e.getDesignation() != null ? e.getDesignation() : "-")
                    .managerName(e.getManager() != null ? e.getManager().getName() : "-")
                    .joiningDate(e.getJoiningDate())
                    .accountStatus(e.getAccountStatus() != null ? e.getAccountStatus() : "ACTIVE")
                    .status(pmsState)
                    .phone(e.getPhone())
                    .profilePhoto(e.getProfilePhoto())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEmployeeLifecycle(Long employeeId) {
        return getEmployeeLifecycle(employeeId, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getEmployeeLifecycle(Long employeeId, String cycleMonth) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));

        List<PmsAssignment> allAssignments = pmsAssignmentRepository.findByEmployee(employee);
        allAssignments.sort((a, b) -> Long.compare(b.getId(), a.getId()));

        Optional<PmsAssignment> assignmentOpt = Optional.empty();
        if (cycleMonth != null && !cycleMonth.trim().isEmpty()) {
            assignmentOpt = allAssignments.stream()
                    .filter(a -> a.getCycleMonth() != null && a.getCycleMonth().trim().equalsIgnoreCase(cycleMonth.trim()))
                    .findFirst();
        }
        if (assignmentOpt.isEmpty() && !allAssignments.isEmpty()) {
            assignmentOpt = Optional.of(allAssignments.get(0));
        }

        Map<String, Object> response = new HashMap<>();

        EmployeeDto empDto = EmployeeDto.builder()
                .id(employee.getId())
                .employeeCode(employee.getEmployeeCode() != null && !employee.getEmployeeCode().isBlank() ? employee.getEmployeeCode() : "EMP-" + employee.getId())
                .name(employee.getName())
                .email(employee.getEmail())
                .department(employee.getDepartment() != null ? employee.getDepartment() : "-")
                .team(employee.getTeam() != null ? employee.getTeam() : "-")
                .designation(employee.getDesignation() != null ? employee.getDesignation() : "-")
                .managerName(employee.getManager() != null ? employee.getManager().getName() : "-")
                .joiningDate(employee.getJoiningDate())
                .accountStatus(employee.getAccountStatus())
                .phone(employee.getPhone())
                .profilePhoto(employee.getProfilePhoto())
                .build();
        response.put("employee", empDto);

        // Populate all available appraisal cycles for this employee
        List<Map<String, Object>> availableCycles = allAssignments.stream().map(a -> {
            Map<String, Object> c = new HashMap<>();
            c.put("assignmentId", a.getId());
            c.put("cycleMonth", a.getCycleMonth() != null ? a.getCycleMonth() : "Cycle-" + a.getId());
            c.put("status", a.getStatus().name());
            c.put("overallScore", a.getOverallScore());
            c.put("performanceGrade", a.getPerformanceGrade());
            c.put("finalizedDate", a.getFinalizedDate());
            return c;
        }).collect(Collectors.toList());
        response.put("availableCycles", availableCycles);

        if (assignmentOpt.isEmpty()) {
            response.put("hasActiveAssignment", false);
            response.put("workflowStages", buildDefaultWorkflowStages(PMSState.PMS_NOT_STARTED));
            response.put("kpis", Collections.emptyList());
            return response;
        }

        PmsAssignment assignment = assignmentOpt.get();
        response.put("hasActiveAssignment", true);
        response.put("assignmentId", assignment.getId());
        response.put("cycleMonth", assignment.getCycleMonth());
        response.put("status", assignment.getStatus().name());
        response.put("startDate", assignment.getStartDate());
        response.put("endDate", assignment.getEndDate());
        response.put("submissionDeadline", assignment.getSubmissionDeadline());
        response.put("overallScore", assignment.getOverallScore());
        response.put("performanceGrade", assignment.getPerformanceGrade());
        response.put("finalizedDate", assignment.getFinalizedDate());

        // Stage progression map
        response.put("workflowStages", buildDefaultWorkflowStages(assignment.getStatus()));

        // KPIs and ratings
        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);

        List<Map<String, Object>> kpiList = new ArrayList<>();
        double calculatedWeightedSum = 0.0;
        double totalWeight = 0.0;

        for (PmsKpi kpi : kpis) {
            EmployeeKpiRating r = ratings.stream()
                    .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                    .findFirst().orElse(null);

            Map<String, Object> km = new HashMap<>();
            km.put("kpiId", kpi.getId());
            km.put("kpiName", kpi.getKpiName());
            km.put("description", kpi.getDescription());
            km.put("weightage", kpi.getWeightage());
            Double hrRating = r != null ? r.getHrRating() : null;
            if (hrRating == null && (assignment.getStatus() == PMSState.COMPLETED || assignment.getStatus() == PMSState.FINAL_RESULT_PUBLISHED)) {
                if (r != null && r.getManagerRating() != null) hrRating = r.getManagerRating();
                else if (assignment.getOverallScore() != null) hrRating = assignment.getOverallScore();
            }
            km.put("selfRating", r != null ? r.getSelfRating() : null);
            km.put("managerRating", r != null ? r.getManagerRating() : null);
            km.put("hrRating", hrRating);
            km.put("comments", r != null ? r.getComments() : null);
            km.put("employeeComments", r != null ? r.getComments() : null);
            km.put("managerComments", r != null ? r.getManagerComments() : null);
            km.put("hrComments", r != null ? r.getHrComments() : null);
            km.put("ratingStatus", r != null ? r.getStatus() : "PENDING");

            // Final score contribution - calculated from Manager and HR ratings average (strictly excluding employee self rating)
            Double effRating = null;
            Double hrR = r != null ? r.getHrRating() : null;
            Double mgrR = r != null ? r.getManagerRating() : null;
            if (hrR != null && hrR >= 1.0 && mgrR != null && mgrR >= 1.0) {
                effRating = (hrR + mgrR) / 2.0;
            } else if (hrR != null && hrR >= 1.0) {
                effRating = hrR;
            } else if (mgrR != null && mgrR >= 1.0) {
                effRating = mgrR;
            }
            if (effRating != null) {
                calculatedWeightedSum += effRating * (kpi.getWeightage() / 100.0);
                totalWeight += kpi.getWeightage();
            }
            km.put("effectiveScore", effRating);
            kpiList.add(km);
        }
        response.put("kpis", kpiList);
        response.put("calculatedScore", totalWeight > 0 ? Math.round((calculatedWeightedSum / (totalWeight / 100.0)) * 100.0) / 100.0 : null);

        // Reviews
        List<EmployeeReview> reviews = employeeReviewRepository.findByAssignment(assignment);
        response.put("reviews", reviews.stream().map(rev -> Map.of(
                "reviewerName", rev.getReviewer().getName(),
                "reviewerRole", rev.getReviewer().getRole().name().replace("ROLE_", ""),
                "comments", rev.getComments() != null ? rev.getComments() : "",
                "reviewDate", rev.getReviewDate() != null ? rev.getReviewDate().toString() : ""
        )).collect(Collectors.toList()));

        // History
        List<PmsHistory> history = pmsHistoryRepository.findByEmployeeOrderByCycleMonthDesc(employee);
        response.put("history", history.stream().map(h -> Map.of(
                "id", h.getId(),
                "cycleMonth", h.getCycleMonth(),
                "finalScore", h.getFinalScore(),
                "grade", h.getGrade(),
                "finalizedDate", h.getFinalizedDate() != null ? h.getFinalizedDate().toString() : ""
        )).collect(Collectors.toList()));

        return response;
    }

    @Transactional
    public Map<String, Object> finalizePms(Long assignmentId, Long hrEmployeeId, HrFinalizeRequest request) {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PMS Assignment not found"));

        Employee hr = employeeRepository.findById(hrEmployeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "HR user not found"));

        // Save individual HR KPI ratings if provided
        if (request.getKpiRatings() != null && !request.getKpiRatings().isEmpty()) {
            List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
            List<EmployeeKpiRating> existingRatings = employeeKpiRatingRepository.findByAssignment(assignment);

            for (HrFinalizeRequest.HrKpiRatingEntry entry : request.getKpiRatings()) {
                if (entry.getKpiId() == null) continue;
                if (entry.getHrRating() != null && (entry.getHrRating() < 1.0 || entry.getHrRating() > 5.0)) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "HR rating must be between 1.0 and 5.0. Rating cannot be 0.");
                }
                if (entry.getManagerRating() != null && (entry.getManagerRating() < 1.0 || entry.getManagerRating() > 5.0)) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Manager rating must be between 1.0 and 5.0. Rating cannot be 0.");
                }
                PmsKpi matchedKpi = kpis.stream()
                        .filter(k -> k.getId().equals(entry.getKpiId()))
                        .findFirst().orElse(null);
                if (matchedKpi == null) continue;

                EmployeeKpiRating rating = existingRatings.stream()
                        .filter(r -> r.getKpi().getId().equals(entry.getKpiId()))
                        .findFirst()
                        .orElseGet(() -> EmployeeKpiRating.builder()
                                .assignment(assignment)
                                .kpi(matchedKpi)
                                .build());

                if (entry.getManagerRating() != null) {
                    rating.setManagerRating(entry.getManagerRating());
                }
                if (entry.getHrRating() != null) {
                    rating.setHrRating(entry.getHrRating());
                }
                rating.setStatus("HR_REVIEWED");
                employeeKpiRatingRepository.save(rating);
            }
        }

        // Re-fetch ratings to evaluate mandatory checks and average calculation
        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);

        // Mandatory check: Every KPI must have valid Manager or HR rating >= 1.0 (empty or 0 not allowed)
        for (PmsKpi kpi : kpis) {
            EmployeeKpiRating r = ratings.stream()
                    .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                    .findFirst().orElse(null);
            Double hrR = r != null ? r.getHrRating() : null;
            Double mgrR = r != null ? r.getManagerRating() : null;
            if ((hrR == null || hrR < 1.0) && (mgrR == null || mgrR < 1.0)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "All KPI ratings are mandatory (scale 1.0 to 5.0). Empty or 0 rating for KPI '" + kpi.getKpiName() + "' is not allowed.");
            }
        }

        // Calculate final score if not explicitly given
        Double finalScore = request.getOverallScore();
        if (finalScore == null || finalScore < 1.0 || finalScore > 5.0) {
            double weightedSum = 0.0;
            double totalWeight = 0.0;

            for (PmsKpi kpi : kpis) {
                EmployeeKpiRating r = ratings.stream()
                        .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                        .findFirst().orElse(null);
                Double score = null;
                Double hrR = r != null ? r.getHrRating() : null;
                Double mgrR = r != null ? r.getManagerRating() : null;
                if (hrR != null && hrR >= 1.0 && mgrR != null && mgrR >= 1.0) {
                    score = (hrR + mgrR) / 2.0;
                } else if (hrR != null && hrR >= 1.0) {
                    score = hrR;
                } else if (mgrR != null && mgrR >= 1.0) {
                    score = mgrR;
                }
                if (score != null) {
                    weightedSum += score * (kpi.getWeightage() / 100.0);
                    totalWeight += kpi.getWeightage();
                }
            }
            finalScore = totalWeight > 0 ? Math.round((weightedSum / (totalWeight / 100.0)) * 100.0) / 100.0 : 4.0;
        }

        String grade = request.getPerformanceGrade();
        if (grade == null || grade.trim().isEmpty()) {
            if (finalScore >= 4.5) grade = "Outstanding Performance";
            else if (finalScore >= 4.0) grade = "Excellent Performance";
            else if (finalScore >= 3.5) grade = "Very Good Performance";
            else if (finalScore >= 3.0) grade = "Good Performance";
            else if (finalScore >= 2.0) grade = "Needs Improvement";
            else grade = "Poor";
        }

        LocalDate today = LocalDate.now();

        assignment.setStatus(PMSState.COMPLETED);
        assignment.setOverallScore(finalScore);
        assignment.setPerformanceGrade(grade);
        assignment.setFinalizedDate(today);
        pmsAssignmentRepository.save(assignment);

        // Save or Update FinalPmsResult
        FinalPmsResult result = finalPmsResultRepository.findByAssignment(assignment)
                .orElseGet(() -> FinalPmsResult.builder().assignment(assignment).build());
        result.setFinalScore(finalScore);
        result.setGrade(grade);
        result.setFinalizedBy(hr);
        result.setFinalizedDate(today);
        finalPmsResultRepository.save(result);

        // Save or Update PmsHistory
        PmsHistory history = pmsHistoryRepository.findFirstByAssignmentId(assignment.getId())
                .orElseGet(() -> PmsHistory.builder()
                        .employee(assignment.getEmployee())
                        .assignmentId(assignment.getId())
                        .cycleMonth(assignment.getCycleMonth())
                        .build());
        history.setFinalScore(finalScore);
        history.setGrade(grade);
        history.setFinalizedDate(today);
        pmsHistoryRepository.save(history);

        // Add HR review comment if provided
        if (request.getHrComments() != null && !request.getHrComments().trim().isEmpty()) {
            EmployeeReview review = EmployeeReview.builder()
                    .assignment(assignment)
                    .reviewer(hr)
                    .comments(request.getHrComments().trim())
                    .reviewDate(today)
                    .build();
            employeeReviewRepository.save(review);
        }

        return Map.of(
                "message", "PMS successfully finalized and published.",
                "assignmentId", assignment.getId(),
                "finalScore", finalScore,
                "grade", grade,
                "status", "COMPLETED"
        );
    }

    @Transactional
    public Map<String, Object> updateKpiRatingsAndComments(Long assignmentId, HrUpdateKpiRatingsRequest request) {
        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PMS Assignment not found"));

        if (request.getKpiRatings() == null || request.getKpiRatings().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "KPI ratings update list cannot be empty.");
        }

        List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
        List<EmployeeKpiRating> existingRatings = employeeKpiRatingRepository.findByAssignment(assignment);

        for (HrUpdateKpiRatingsRequest.HrKpiRatingUpdateEntry entry : request.getKpiRatings()) {
            if (entry.getKpiId() == null) continue;
            if (entry.getSelfRating() != null && (entry.getSelfRating() < 1.0 || entry.getSelfRating() > 5.0)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Self rating must be between 1.0 and 5.0. Rating cannot be 0.");
            }
            if (entry.getManagerRating() != null && (entry.getManagerRating() < 1.0 || entry.getManagerRating() > 5.0)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Manager rating must be between 1.0 and 5.0. Rating cannot be 0.");
            }
            if (entry.getHrRating() != null && (entry.getHrRating() < 1.0 || entry.getHrRating() > 5.0)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "HR rating must be between 1.0 and 5.0. Rating cannot be 0.");
            }
            PmsKpi matchedKpi = kpis.stream()
                    .filter(k -> k.getId().equals(entry.getKpiId()))
                    .findFirst().orElse(null);
            if (matchedKpi == null) continue;

            EmployeeKpiRating rating = existingRatings.stream()
                    .filter(r -> r.getKpi().getId().equals(entry.getKpiId()))
                    .findFirst()
                    .orElseGet(() -> EmployeeKpiRating.builder()
                                    .assignment(assignment)
                                    .kpi(matchedKpi)
                                    .build());

            if (entry.getSelfRating() != null) {
                rating.setSelfRating(entry.getSelfRating());
            }
            if (entry.getEmployeeComments() != null) {
                rating.setComments(entry.getEmployeeComments());
            }
            if (entry.getManagerRating() != null) {
                rating.setManagerRating(entry.getManagerRating());
            }
            if (entry.getManagerComments() != null) {
                rating.setManagerComments(entry.getManagerComments());
            }
            if (entry.getHrRating() != null) {
                rating.setHrRating(entry.getHrRating());
            }
            if (entry.getHrComments() != null) {
                rating.setHrComments(entry.getHrComments());
            }
            rating.setStatus("HR_EDITED");
            employeeKpiRatingRepository.save(rating);
        }

        // Recalculate overall weighted score on PmsAssignment for employee, manager, and HR dashboards
        // (Calculated from Manager and HR ratings only - strictly excluding employee self rating)
        List<EmployeeKpiRating> updatedRatings = employeeKpiRatingRepository.findByAssignment(assignment);
        double weightedSum = 0.0;
        double totalWeight = 0.0;

        for (PmsKpi kpi : kpis) {
            EmployeeKpiRating r = updatedRatings.stream()
                    .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                    .findFirst().orElse(null);
            Double score = null;
            Double hrR = r != null ? r.getHrRating() : null;
            Double mgrR = r != null ? r.getManagerRating() : null;
            if (hrR != null && hrR >= 1.0 && mgrR != null && mgrR >= 1.0) {
                score = (hrR + mgrR) / 2.0;
            } else if (hrR != null && hrR >= 1.0) {
                score = hrR;
            } else if (mgrR != null && mgrR >= 1.0) {
                score = mgrR;
            }
            if (score != null) {
                weightedSum += score * (kpi.getWeightage() / 100.0);
                totalWeight += kpi.getWeightage();
            }
        }

        if (totalWeight > 0) {
            double calcScore = Math.round((weightedSum / (totalWeight / 100.0)) * 100.0) / 100.0;
            assignment.setOverallScore(calcScore);

            String grade;
            if (calcScore >= 4.5) grade = "Outstanding Performance";
            else if (calcScore >= 4.0) grade = "Excellent Performance";
            else if (calcScore >= 3.5) grade = "Very Good Performance";
            else if (calcScore >= 3.0) grade = "Good Performance";
            else if (calcScore >= 2.0) grade = "Needs Improvement";
            else grade = "Poor";

            assignment.setPerformanceGrade(grade);
            pmsAssignmentRepository.save(assignment);

            // Synchronize with FinalPmsResult and PmsHistory if present
            finalPmsResultRepository.findByAssignment(assignment).ifPresent(res -> {
                res.setFinalScore(calcScore);
                res.setGrade(grade);
                finalPmsResultRepository.save(res);
            });

            pmsHistoryRepository.findFirstByAssignmentId(assignment.getId()).ifPresent(h -> {
                h.setFinalScore(calcScore);
                h.setGrade(grade);
                pmsHistoryRepository.save(h);
            });
        }

        return Map.of(
                "message", "KPI ratings and comments updated successfully.",
                "assignmentId", assignment.getId(),
                "updatedCount", request.getKpiRatings().size()
        );
    }

    @Transactional(readOnly = true)
    public HrReportSummaryDto getRatingCategorySummary() {
        List<PmsHistory> allHistory = pmsHistoryRepository.findAll();

        List<HrReportSummaryDto.CategoryEmployeeDto> excellentEmployees = new ArrayList<>();
        List<HrReportSummaryDto.CategoryEmployeeDto> veryGoodEmployees = new ArrayList<>();
        List<HrReportSummaryDto.CategoryEmployeeDto> goodEmployees = new ArrayList<>();
        List<HrReportSummaryDto.CategoryEmployeeDto> needsImpEmployees = new ArrayList<>();
        List<HrReportSummaryDto.CategoryEmployeeDto> poorEmployees = new ArrayList<>();
        List<HrReportSummaryDto.CategoryEmployeeDto> allCategoryEmployees = new ArrayList<>();

        double sumScores = 0.0;

        for (PmsHistory h : allHistory) {
            double score = h.getFinalScore() != null ? h.getFinalScore() : 0.0;
            sumScores += score;

            Employee emp = h.getEmployee();
            HrReportSummaryDto.CategoryEmployeeDto empDto = HrReportSummaryDto.CategoryEmployeeDto.builder()
                    .id(h.getId())
                    .employeeId(emp != null ? emp.getId() : null)
                    .employeeCode(emp != null && emp.getEmployeeCode() != null ? emp.getEmployeeCode() : (emp != null ? "EMP-" + emp.getId() : ""))
                    .name(emp != null ? emp.getName() : "Unknown")
                    .designation(emp != null && emp.getDesignation() != null ? emp.getDesignation() : "-")
                    .department(emp != null && emp.getDepartment() != null ? emp.getDepartment() : "-")
                    .managerName(emp != null && emp.getManager() != null ? emp.getManager().getName() : "N/A")
                    .finalScore(score)
                    .grade(h.getGrade())
                    .cycleMonth(h.getCycleMonth())
                    .assignmentId(h.getAssignmentId())
                    .profilePhoto(emp != null ? emp.getProfilePhoto() : null)
                    .build();

            allCategoryEmployees.add(empDto);

            if (score >= 4.2) {
                excellentEmployees.add(empDto);
            } else if (score >= 3.8) {
                veryGoodEmployees.add(empDto);
            } else if (score >= 3.0) {
                goodEmployees.add(empDto);
            } else if (score >= 2.0) {
                needsImpEmployees.add(empDto);
            } else {
                poorEmployees.add(empDto);
            }
        }

        long total = allHistory.size();
        List<HrReportSummaryDto.RatingCategoryDto> cats = new ArrayList<>();

        cats.add(new HrReportSummaryDto.RatingCategoryDto("Excellent", excellentEmployees.size(), total > 0 ? Math.round((excellentEmployees.size() * 100.0 / total) * 10.0) / 10.0 : 0.0, excellentEmployees));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Very Good", veryGoodEmployees.size(), total > 0 ? Math.round((veryGoodEmployees.size() * 100.0 / total) * 10.0) / 10.0 : 0.0, veryGoodEmployees));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Good", goodEmployees.size(), total > 0 ? Math.round((goodEmployees.size() * 100.0 / total) * 10.0) / 10.0 : 0.0, goodEmployees));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Needs Improvement", needsImpEmployees.size(), total > 0 ? Math.round((needsImpEmployees.size() * 100.0 / total) * 10.0) / 10.0 : 0.0, needsImpEmployees));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Poor", poorEmployees.size(), total > 0 ? Math.round((poorEmployees.size() * 100.0 / total) * 10.0) / 10.0 : 0.0, poorEmployees));

        return HrReportSummaryDto.builder()
                .categories(cats)
                .totalFinalizedRecords(total)
                .averageScore(total > 0 ? Math.round((sumScores / total) * 100.0) / 100.0 : null)
                .allEmployees(allCategoryEmployees)
                .build();
    }

    private List<Map<String, Object>> buildDefaultWorkflowStages(PMSState state) {
        List<Map<String, Object>> stages = new ArrayList<>();

        // 1. Self Assessment
        boolean selfStarted = state != PMSState.PMS_NOT_STARTED;
        boolean selfSubmitted = state == PMSState.SELF_ASSESSMENT_SUBMITTED ||
                state == PMSState.MANAGER_REVIEW_PENDING ||
                state == PMSState.MANAGER_REVIEW_SUBMITTED ||
                state == PMSState.HR_REVIEW_PENDING ||
                state == PMSState.HR_REVIEW_COMPLETED ||
                state == PMSState.FINAL_RESULT_PUBLISHED ||
                state == PMSState.COMPLETED;

        stages.add(Map.of(
                "step", 1,
                "title", "Self Assessment",
                "status", selfSubmitted ? "Completed" : (selfStarted ? "In Progress" : "Not Started")
        ));

        // 2. Submitted
        stages.add(Map.of(
                "step", 2,
                "title", "Submitted",
                "status", selfSubmitted ? "Completed" : "Not Started"
        ));

        // 3. Manager Review
        boolean managerSubmitted = state == PMSState.MANAGER_REVIEW_SUBMITTED ||
                state == PMSState.HR_REVIEW_PENDING ||
                state == PMSState.HR_REVIEW_COMPLETED ||
                state == PMSState.FINAL_RESULT_PUBLISHED ||
                state == PMSState.COMPLETED;

        stages.add(Map.of(
                "step", 3,
                "title", "Manager Review",
                "status", managerSubmitted ? "Completed" : (selfSubmitted ? "Pending" : "Not Started")
        ));

        // 4. HR Review
        boolean hrDone = state == PMSState.HR_REVIEW_COMPLETED ||
                state == PMSState.FINAL_RESULT_PUBLISHED ||
                state == PMSState.COMPLETED;

        stages.add(Map.of(
                "step", 4,
                "title", "HR Review",
                "status", hrDone ? "Completed" : (managerSubmitted ? "Pending" : "Not Started")
        ));

        // 5. Final Result
        boolean finalDone = state == PMSState.FINAL_RESULT_PUBLISHED || state == PMSState.COMPLETED;

        stages.add(Map.of(
                "step", 5,
                "title", "Final Result",
                "status", finalDone ? "Completed" : "Not Started"
        ));

        return stages;
    }

    @Transactional
    public Map<String, Object> initiateCycle(InitiateCycleRequest request) {
        if (request.getCycleMonth() == null || request.getCycleMonth().trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cycle month is required (e.g. 'October 2026')");
        }

        String cycleMonth = request.getCycleMonth().trim();
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().withDayOfMonth(1);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : startDate.plusMonths(1).minusDays(1);
        LocalDate submissionDeadline = request.getSubmissionDeadline() != null ? request.getSubmissionDeadline() : startDate.plusDays(25);

        List<Employee> activeEmployees = employeeRepository.findAll().stream()
                .filter(e -> !"INACTIVE".equalsIgnoreCase(e.getAccountStatus()))
                .collect(Collectors.toList());

        int createdCount = 0;
        for (Employee emp : activeEmployees) {
            Optional<PmsAssignment> existing = pmsAssignmentRepository.findByEmployeeAndCycleMonth(emp, cycleMonth);
            if (existing.isPresent()) {
                continue; // already exists for this cycle
            }

            PmsAssignment assignment = PmsAssignment.builder()
                    .employee(emp)
                    .cycleMonth(cycleMonth)
                    .status(PMSState.SELF_ASSESSMENT_DRAFT)
                    .startDate(startDate)
                    .endDate(endDate)
                    .submissionDeadline(submissionDeadline)
                    .build();
            assignment = pmsAssignmentRepository.save(assignment);

            String designation = emp.getDesignation() != null ? emp.getDesignation().trim() : "Software Engineer";
            List<KpiMaster> masterKpis = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus(designation, "ACTIVE");
            if (masterKpis.isEmpty()) {
                masterKpis = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus("Software Engineer", "ACTIVE");
            }
            if (masterKpis.isEmpty()) {
                masterKpis = kpiMasterRepository.findByStatus("ACTIVE");
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
            createdCount++;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("cycleMonth", cycleMonth);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        result.put("submissionDeadline", submissionDeadline);
        result.put("initiatedEmployeesCount", createdCount);
        result.put("totalActiveEmployees", activeEmployees.size());
        result.put("message", "Successfully launched PMS cycle '" + cycleMonth + "' for " + createdCount + " employees.");
        return result;
    }
}
