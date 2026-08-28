package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerEmployeeDto {
    private Long id;
    private String employeeCode;
    private String name;
    private String email;
    private String designation;
    private String department;
    private String team;
    private LocalDate joiningDate;
    private String accountStatus;

    // Active assignment info
    private Long assignmentId;
    private String cycleMonth;
    private String status;
    private boolean canReview;
    private Double overallScore;
    private String performanceGrade;
    private int kpisCount;
    private int completedKpisCount;
    private String profilePhoto;
}
