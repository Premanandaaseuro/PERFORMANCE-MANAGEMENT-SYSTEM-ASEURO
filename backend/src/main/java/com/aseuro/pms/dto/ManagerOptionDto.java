package com.aseuro.pms.dto;

public record ManagerOptionDto(
        Long id,
        String fullName,
        String employeeCode,
        String email,
        String designationName,
        Long managerId,
        String managerName
) {}
