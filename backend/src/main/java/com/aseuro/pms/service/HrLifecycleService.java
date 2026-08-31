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

    public HrLifecycleService(
            EmployeeRepository employeeRepository,
            PmsAssignmentRepository pmsAssignmentRepository,
            PmsKpiRepository pmsKpiRepository,
            EmployeeKpiRatingRepository employeeKpiRatingRepository,
            EmployeeReviewRepository employeeReviewRepository,
            FinalPmsResultRepository finalPmsResultRepository,
            PmsHistoryRepository pmsHistoryRepository) {
        this.employeeRepository = employeeRepository;
        this.pmsAssignmentRepository = pmsAssignmentRepository;
        this.pmsKpiRepository = pmsKpiRepository;
        this.employeeKpiRatingRepository = employeeKpiRatingRepository;
        this.employeeReviewRepository = employeeReviewRepository;
        this.finalPmsResultRepository = finalPmsResultRepository;
        this.pmsHistoryRepository = pmsHistoryRepository;
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
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));

        Optional<PmsAssignment> assignmentOpt = pmsAssignmentRepository.findFirstByEmployeeOrderByStartDateDesc(employee);

        Map<String, Object> response = new HashMap<>();

        EmployeeDto empDto = EmployeeDto.builder()
                .id(employee.getId())
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
                else if (r != null && r.getSelfRating() != null) hrRating = r.getSelfRating();
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

            // Final score contribution
            Double effRating = null;
            if (r != null) {
                if (r.getHrRating() != null) effRating = r.getHrRating();
                else if (r.getManagerRating() != null) effRating = r.getManagerRating();
                else if (r.getSelfRating() != null) effRating = r.getSelfRating();
            }
            if (effRating != null) {
                calculatedWeightedSum += effRating * (kpi.getWeightage() / 100.0);
                totalWeight += kpi.getWeightage();
            }
            km.put("effectiveScore", effRating);
            kpiList.add(km);
        }
        response.put("kpis", kpiList);
        response.put("calculatedScore", totalWeight > 0 ? Math.round(calculatedWeightedSum * 100.0) / 100.0 : null);

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
                if (entry.getKpiId() == null || entry.getHrRating() == null) continue;
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

        // Calculate final score if not explicitly given
        Double finalScore = request.getOverallScore();
        if (finalScore == null || finalScore <= 0) {
            List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(assignment);
            List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(assignment);
            double weightedSum = 0.0;
            double totalWeight = 0.0;

            for (PmsKpi kpi : kpis) {
                EmployeeKpiRating r = ratings.stream()
                        .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                        .findFirst().orElse(null);
                Double score = 4.0; // fallback
                if (r != null) {
                    if (r.getHrRating() != null) score = r.getHrRating();
                    else if (r.getManagerRating() != null) score = r.getManagerRating();
                    else if (r.getSelfRating() != null) score = r.getSelfRating();
                }
                weightedSum += score * (kpi.getWeightage() / 100.0);
                totalWeight += kpi.getWeightage();
            }
            finalScore = totalWeight > 0 ? Math.round(weightedSum * 100.0) / 100.0 : 4.0;
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
        List<EmployeeKpiRating> updatedRatings = employeeKpiRatingRepository.findByAssignment(assignment);
        double weightedSum = 0.0;
        double totalWeight = 0.0;

        for (PmsKpi kpi : kpis) {
            EmployeeKpiRating r = updatedRatings.stream()
                    .filter(rt -> rt.getKpi().getId().equals(kpi.getId()))
                    .findFirst().orElse(null);
            Double score = null;
            if (r != null) {
                if (r.getHrRating() != null) score = r.getHrRating();
                else if (r.getManagerRating() != null) score = r.getManagerRating();
                else if (r.getSelfRating() != null) score = r.getSelfRating();
            }
            if (score != null) {
                weightedSum += score * (kpi.getWeightage() / 100.0);
                totalWeight += kpi.getWeightage();
            }
        }

        if (totalWeight > 0) {
            double calcScore = Math.round(weightedSum * 100.0) / 100.0;
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

        long excellentCount = 0;
        long veryGoodCount = 0;
        long goodCount = 0;
        long needsImpCount = 0;
        long poorCount = 0;

        double sumScores = 0.0;

        for (PmsHistory h : allHistory) {
            double score = h.getFinalScore() != null ? h.getFinalScore() : 0.0;
            sumScores += score;
            if (score >= 4.2) excellentCount++;
            else if (score >= 3.8) veryGoodCount++;
            else if (score >= 3.0) goodCount++;
            else if (score >= 2.0) needsImpCount++;
            else poorCount++;
        }

        long total = allHistory.size();
        List<HrReportSummaryDto.RatingCategoryDto> cats = new ArrayList<>();

        cats.add(new HrReportSummaryDto.RatingCategoryDto("Excellent", excellentCount, total > 0 ? Math.round((excellentCount * 100.0 / total) * 10.0) / 10.0 : 0.0));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Very Good", veryGoodCount, total > 0 ? Math.round((veryGoodCount * 100.0 / total) * 10.0) / 10.0 : 0.0));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Good", goodCount, total > 0 ? Math.round((goodCount * 100.0 / total) * 10.0) / 10.0 : 0.0));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Needs Improvement", needsImpCount, total > 0 ? Math.round((needsImpCount * 100.0 / total) * 10.0) / 10.0 : 0.0));
        cats.add(new HrReportSummaryDto.RatingCategoryDto("Poor", poorCount, total > 0 ? Math.round((poorCount * 100.0 / total) * 10.0) / 10.0 : 0.0));

        return HrReportSummaryDto.builder()
                .categories(cats)
                .totalFinalizedRecords(total)
                .averageScore(total > 0 ? Math.round((sumScores / total) * 100.0) / 100.0 : null)
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
}
