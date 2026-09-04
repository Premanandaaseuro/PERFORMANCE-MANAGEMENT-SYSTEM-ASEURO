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
public class HrReportSummaryDto {
    private List<RatingCategoryDto> categories;
    private long totalFinalizedRecords;
    private Double averageScore;
    private List<CategoryEmployeeDto> allEmployees;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RatingCategoryDto {
        private String category;
        private long count;
        private double percentage;
        private List<CategoryEmployeeDto> employees;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryEmployeeDto {
        private Long id;
        private Long employeeId;
        private String employeeCode;
        private String name;
        private String designation;
        private String department;
        private String managerName;
        private Double finalScore;
        private String grade;
        private String cycleMonth;
        private Long assignmentId;
        private String profilePhoto;
    }
}
