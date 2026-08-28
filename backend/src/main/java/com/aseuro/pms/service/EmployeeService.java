package com.aseuro.pms.service;

import com.aseuro.pms.dto.EmployeeDto;
import com.aseuro.pms.model.Employee;
import com.aseuro.pms.repository.EmployeeRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployeeProfile(Long employeeId) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new UsernameNotFoundException("Employee not found with id: " + employeeId));

        return convertToDto(emp);
    }

    @Transactional
    public EmployeeDto updateProfile(Long employeeId, com.aseuro.pms.dto.UpdateProfileRequest request) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new UsernameNotFoundException("Employee not found with id: " + employeeId));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            emp.setName(request.getName().trim());
        }
        if (request.getPhone() != null) {
            emp.setPhone(request.getPhone().trim());
        }
        if (request.getProfilePhoto() != null) {
            emp.setProfilePhoto(request.getProfilePhoto());
        }

        Employee saved = employeeRepository.save(emp);
        return convertToDto(saved);
    }

    public EmployeeDto convertToDto(Employee emp) {
        return EmployeeDto.builder()
                .id(emp.getId())
                .name(emp.getName())
                .email(emp.getEmail())
                .department(emp.getDepartment())
                .team(emp.getTeam())
                .designation(emp.getDesignation())
                .managerName(emp.getManager() != null ? emp.getManager().getName() : "N/A")
                .joiningDate(emp.getJoiningDate())
                .accountStatus(emp.getAccountStatus())
                .phone(emp.getPhone())
                .profilePhoto(emp.getProfilePhoto())
                .build();
    }
}
