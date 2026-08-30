package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiMasterDto {
    private Long id;
    private String designation;
    private String kpiName;
    private String description;
    private Double weightage;
    private String selfRatingScale;
    private String managerRatingScale;
    private String status;
}
