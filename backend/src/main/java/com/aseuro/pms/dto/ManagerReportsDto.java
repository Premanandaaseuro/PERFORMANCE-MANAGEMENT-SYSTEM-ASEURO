package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerReportsDto {
    private List<ManagerEmployeeDto> assignedEmployees;
    private long totalAssigned;
    private long selfAssessmentPendingCount;
    private long selfAssessmentCompletedCount;
    private long managerReviewPendingCount;
    private long managerReviewCompletedCount;
    private long finalizedRecordsCount;
}
