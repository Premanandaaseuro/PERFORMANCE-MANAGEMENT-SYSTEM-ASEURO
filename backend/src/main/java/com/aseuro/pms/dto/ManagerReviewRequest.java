package com.aseuro.pms.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerReviewRequest {
    @NotEmpty(message = "Ratings cannot be empty")
    private List<ManagerKpiRatingEntry> ratings;
    private String managerComments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManagerKpiRatingEntry {
        private Long kpiId;
        private Double managerRating;
        private String managerComments;
    }
}
