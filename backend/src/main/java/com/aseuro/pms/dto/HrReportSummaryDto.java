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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RatingCategoryDto {
        private String category;
        private long count;
        private double percentage;
    }
}
