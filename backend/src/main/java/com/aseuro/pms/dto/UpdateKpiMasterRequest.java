package com.aseuro.pms.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateKpiMasterRequest {
    @NotBlank(message = "KPI Name is required")
    private String kpiName;

    private String description;

    @NotNull(message = "Weightage is required")
    @DecimalMin(value = "1.0", message = "Weightage must be at least 1%")
    @DecimalMax(value = "100.0", message = "Weightage cannot exceed 100%")
    private Double weightage;

    private String status;
}
