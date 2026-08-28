package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HrDashboardStatsDto {
    private long totalEmployees;
    private long totalManagers;
    private long totalDesignations;
    private long completedCycles;
    private long pendingSelfAssessments;
    private long pendingManagerReviews;
    private long pendingHrReviews;
}
