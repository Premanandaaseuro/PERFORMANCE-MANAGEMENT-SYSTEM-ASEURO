package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerDashboardDto {
    private String managerName;
    private String currentCycle;
    private String mySelfAssessmentStatus;
    private long employeesAssigned;
    private long pendingEmployeeReviews;
    private long completedEmployeeReviews;
    private Double latestFinalizedScore;
    private String latestFinalizedGrade;
    private String workflowHeading;
    private String workflowStatus;
    private String workflowSubStatus;
    private int activeStep;
    private String actionRequired;
}
