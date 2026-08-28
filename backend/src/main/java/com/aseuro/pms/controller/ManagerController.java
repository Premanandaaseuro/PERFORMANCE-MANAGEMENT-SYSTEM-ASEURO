package com.aseuro.pms.controller;

import com.aseuro.pms.dto.*;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.model.Employee;
import com.aseuro.pms.model.PmsAssignment;
import com.aseuro.pms.repository.EmployeeRepository;
import com.aseuro.pms.repository.PmsAssignmentRepository;
import com.aseuro.pms.security.UserPrincipal;
import com.aseuro.pms.service.ManagerService;
import com.aseuro.pms.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('MANAGER', 'ROLE_MANAGER')")
public class ManagerController {

    private final ManagerService managerService;
    private final ReportService reportService;
    private final EmployeeRepository employeeRepository;
    private final PmsAssignmentRepository pmsAssignmentRepository;

    // 1. Manager Dashboard Stats & Workflow Info
    @GetMapping("/dashboard")
    public ResponseEntity<ManagerDashboardDto> getDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        ManagerDashboardDto dto = managerService.getDashboardData(principal.getId());
        return ResponseEntity.ok(dto);
    }

    // 2. View New Employees Assigned to authenticated manager
    @GetMapping("/employees")
    public ResponseEntity<List<ManagerEmployeeDto>> getAssignedEmployees(@AuthenticationPrincipal UserPrincipal principal) {
        List<ManagerEmployeeDto> employees = managerService.getAssignedEmployees(principal.getId());
        return ResponseEntity.ok(employees);
    }

    // 3. Get Employee KPI Review Detail
    @GetMapping("/employees/{employeeId}/pms")
    public ResponseEntity<Map<String, Object>> getEmployeeKpiReview(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> data = managerService.getEmployeeKpiReview(principal.getId(), employeeId);
        return ResponseEntity.ok(data);
    }

    // 4. Submit Manager Review
    @PostMapping("/pms/{assignmentId}/submit")
    public ResponseEntity<Map<String, Object>> submitManagerReview(
            @PathVariable Long assignmentId,
            @Valid @RequestBody ManagerReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> result = managerService.submitManagerReview(principal.getId(), assignmentId, request);
        return ResponseEntity.ok(result);
    }

    // 5. Manager Reports Summary
    @GetMapping("/reports")
    public ResponseEntity<ManagerReportsDto> getManagerReports(@AuthenticationPrincipal UserPrincipal principal) {
        ManagerReportsDto reports = managerService.getManagerReports(principal.getId());
        return ResponseEntity.ok(reports);
    }

    // 6. Download Finalized/Active Report for assigned employee
    @GetMapping("/reports/download")
    public ResponseEntity<byte[]> downloadReport(
            @RequestParam Long assignmentId,
            @RequestParam(defaultValue = "pdf") String format,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {

        PmsAssignment assignment = pmsAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Assignment not found"));

        // Validate that this assignment belongs to an employee reporting to this manager
        if (assignment.getEmployee().getManager() == null ||
            !assignment.getEmployee().getManager().getId().equals(principal.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Unauthorized: Employee does not report to you.");
        }

        byte[] data;
        String filename;
        MediaType mediaType;

        if ("excel".equalsIgnoreCase(format)) {
            data = reportService.generateExcelReport(principal.getId(), assignmentId);
            filename = "PMS_Report_" + assignment.getEmployee().getName().replace(" ", "_") + "_" + assignmentId + ".xlsx";
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            data = reportService.generatePdfReport(principal.getId(), assignmentId);
            filename = "PMS_Report_" + assignment.getEmployee().getName().replace(" ", "_") + "_" + assignmentId + ".pdf";
            mediaType = MediaType.APPLICATION_PDF;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(data);
    }
}
