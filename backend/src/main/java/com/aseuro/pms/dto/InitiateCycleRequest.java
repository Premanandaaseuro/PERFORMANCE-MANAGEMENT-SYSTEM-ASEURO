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
public class InitiateCycleRequest {
    private String cycleMonth;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate submissionDeadline;
}
