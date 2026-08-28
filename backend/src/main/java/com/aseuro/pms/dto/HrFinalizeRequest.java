package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrFinalizeRequest {
    private Double overallScore;
    private String performanceGrade;
    private String hrComments;
    private List<HrKpiRatingEntry> kpiRatings;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HrKpiRatingEntry {
        private Long kpiId;
        private Double hrRating;
        private Double managerRating;
    }
}

