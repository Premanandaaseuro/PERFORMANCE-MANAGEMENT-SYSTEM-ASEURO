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
public class UpdateEmployeeRequest {
    private String name;
    private String fullName;
    private String email;
    private String role;
    private String department;
    private String designation;
    private String team;
    private Long managerId;
    private String accountStatus;
    private LocalDate joiningDate;

    public String getEffectiveName() {
        if (name != null && !name.trim().isEmpty()) return name.trim();
        if (fullName != null && !fullName.trim().isEmpty()) return fullName.trim();
        return null;
    }
}
