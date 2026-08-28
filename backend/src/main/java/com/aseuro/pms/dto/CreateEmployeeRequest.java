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
public class CreateEmployeeRequest {
    private String employeeCode;
    private String fullName;
    private String name;
    private String email;
    private String password;
    private String role;
    private String department;
    private Long departmentId;
    private String designation;
    private Long designationId;
    private String team;
    private Long teamId;
    private Long managerId;
    private LocalDate joiningDate;

    public String getEffectiveName() {
        if (fullName != null && !fullName.trim().isEmpty()) return fullName.trim();
        if (name != null && !name.trim().isEmpty()) return name.trim();
        return "Employee";
    }

    public String employeeCode() { return this.employeeCode; }
    public String fullName() { return this.getEffectiveName(); }
    public String email() { return this.email; }
    public String password() { return this.password; }
    public Long departmentId() { return this.departmentId; }
    public Long designationId() { return this.designationId; }
    public Long teamId() { return this.teamId; }
    public Long managerId() { return this.managerId; }
    public LocalDate joiningDate() { return this.joiningDate; }
}
