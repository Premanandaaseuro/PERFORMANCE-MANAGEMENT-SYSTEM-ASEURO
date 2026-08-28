package com.aseuro.pms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDto {
    private Long id;
    private Long userId;
    private String employeeCode;
    private String fullName;
    private String name;
    private String email;
    private String role;
    private Long departmentId;
    private String departmentName;
    private String department;
    private String team;
    private Long designationId;
    private String designationName;
    private String designation;
    private Long managerId;
    private String managerName;
    private String joiningDateStr;
    private LocalDate joiningDate;
    private String accountStatus;
    private String status;
    private Instant createdAt;
    private String phone;
    private String profilePhoto;

    public EmployeeDto(Long id, Long userId, String employeeCode, String fullName, String email, String role,
                       Long departmentId, String departmentName, Long designationId, String designationName,
                       Long managerId, String managerName, LocalDate joiningDate, String status, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.employeeCode = employeeCode;
        this.fullName = fullName;
        this.name = fullName;
        this.email = email;
        this.role = role;
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.department = departmentName;
        this.designationId = designationId;
        this.designationName = designationName;
        this.designation = designationName;
        this.managerId = managerId;
        this.managerName = managerName;
        this.joiningDate = joiningDate;
        this.status = status;
        this.accountStatus = status;
        this.createdAt = createdAt;
    }
}
