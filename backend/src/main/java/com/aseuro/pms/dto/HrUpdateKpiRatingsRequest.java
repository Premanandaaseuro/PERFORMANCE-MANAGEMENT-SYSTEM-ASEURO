package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HrUpdateKpiRatingsRequest {

    private List<HrKpiRatingUpdateEntry> kpiRatings;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HrKpiRatingUpdateEntry {
        private Long kpiId;
        private Double selfRating;       // HR editing Employee Self Rating
        private String employeeComments; // HR editing Employee Comments / Evidence
        private Double managerRating;    // HR editing Manager Rating (25% HR KPIs or HR override)
        private String managerComments;  // HR editing Manager Comments
        private Double hrRating;         // HR Rating
    }
}
