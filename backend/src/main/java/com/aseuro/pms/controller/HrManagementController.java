package com.aseuro.pms.controller;

import com.aseuro.pms.dto.*;
import com.aseuro.pms.exception.ApiException;
import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import com.aseuro.pms.security.UserPrincipal;
import com.aseuro.pms.service.EmailService;
import com.aseuro.pms.service.HrKpiService;
import com.aseuro.pms.service.HrLifecycleService;
import com.aseuro.pms.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HR', 'ROLE_HR')")
public class HrManagementController {

    private final EmployeeRepository employeeRepository;
    private final PmsAssignmentRepository pmsAssignmentRepository;
    private final PmsKpiRepository pmsKpiRepository;
    private final KpiMasterRepository kpiMasterRepository;
    private final DesignationRepository designationRepository;
    private final PasswordEncoder passwordEncoder;
    private final HrKpiService hrKpiService;
    private final HrLifecycleService hrLifecycleService;
    private final ReportService reportService;
    private final EmailService emailService;
    private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
    private final EmployeeReviewRepository employeeReviewRepository;
    private final PmsHistoryRepository pmsHistoryRepository;
    private final FinalPmsResultRepository finalPmsResultRepository;

    // 1. Dashboard Overview Stats
    @GetMapping("/dashboard")
    public ResponseEntity<HrDashboardStatsDto> getDashboardStats() {
        List<Employee> allEmployees = employeeRepository.findAll();
        long totalEmp = allEmployees.stream().filter(e -> e.getRole() == Role.ROLE_EMPLOYEE).count();
        long totalMgr = allEmployees.stream().filter(e -> e.getRole() == Role.ROLE_MANAGER).count();
        long totalDesig = hrKpiService.getAllDesignations().size();

        List<PmsAssignment> assignments = pmsAssignmentRepository.findAll();
        long completed = assignments.stream().filter(a -> a.getStatus() == PMSState.COMPLETED || a.getStatus() == PMSState.FINAL_RESULT_PUBLISHED).count();
        long pendingSelf = assignments.stream().filter(a -> a.getStatus() == PMSState.PMS_STARTED || a.getStatus() == PMSState.SELF_ASSESSMENT_DRAFT).count();
        long pendingMgr = assignments.stream().filter(a -> a.getStatus() == PMSState.SELF_ASSESSMENT_SUBMITTED || a.getStatus() == PMSState.MANAGER_REVIEW_PENDING).count();
        long pendingHr = assignments.stream().filter(a -> a.getStatus() == PMSState.MANAGER_REVIEW_SUBMITTED || a.getStatus() == PMSState.HR_REVIEW_PENDING).count();

        HrDashboardStatsDto stats = HrDashboardStatsDto.builder()
                .totalEmployees(totalEmp)
                .totalManagers(totalMgr)
                .totalDesignations(totalDesig)
                .completedCycles(completed)
                .pendingSelfAssessments(pendingSelf)
                .pendingManagerReviews(pendingMgr)
                .pendingHrReviews(pendingHr)
                .build();

        return ResponseEntity.ok(stats);
    }

    // 2. Designation List
    @GetMapping("/designations")
    public ResponseEntity<List<Map<String, Object>>> getDesignations() {
        List<String> list = hrKpiService.getAllDesignations();
        List<Map<String, Object>> result = new ArrayList<>();
        long id = 1;
        for (String d : list) {
            result.add(Map.of("id", id++, "name", d, "description", d + " Role Profile"));
        }
        return ResponseEntity.ok(result);
    }

    // Create New Role / Designation
    @PostMapping("/designations")
    @Transactional
    public ResponseEntity<Map<String, Object>> createDesignation(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        if (name == null || name.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Role / Designation name is required.");
        }
        String desigName = name.trim();
        String description = request.get("description") != null ? request.get("description").trim() : desigName + " Role Profile";

        Optional<com.aseuro.pms.entity.Designation> existingOpt = designationRepository.findByNameIgnoreCase(desigName);
        com.aseuro.pms.entity.Designation designation;
        if (existingOpt.isPresent()) {
            designation = existingOpt.get();
        } else {
            designation = new com.aseuro.pms.entity.Designation(desigName, description);
            designation = designationRepository.save(designation);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", designation.getId(),
                "name", designation.getName(),
                "description", designation.getDescription() != null ? designation.getDescription() : "",
                "message", "Role / Designation created successfully."
        ));
    }

    // 3. Manager Options for Dropdown & List
    @GetMapping("/managers")
    public ResponseEntity<List<ManagerOptionDto>> getManagers() {
        List<Employee> managers = employeeRepository.findAll().stream()
                .filter(e -> e.getRole() == Role.ROLE_MANAGER)
                .collect(Collectors.toList());

        List<ManagerOptionDto> list = managers.stream()
                .map(m -> new ManagerOptionDto(
                        m.getId(),
                        m.getName(),
                        "MGR-" + m.getId(),
                        m.getEmail(),
                        m.getDesignation() != null ? m.getDesignation() : "Engineering Manager",
                        m.getManager() != null ? m.getManager().getId() : null,
                        m.getManager() != null ? m.getManager().getName() : null
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // 4. Create Manager
    @PostMapping("/managers")
    @Transactional
    public ResponseEntity<Map<String, Object>> createManager(@Valid @RequestBody CreateManagerRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (employeeRepository.findByEmail(email).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email already exists in the system.");
        }

        Employee reportingManager = null;
        if (request.getManagerId() != null) {
            reportingManager = employeeRepository.findById(request.getManagerId()).orElse(null);
        }

        Employee manager = Employee.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .department(request.getDepartment() != null ? request.getDepartment().trim() : "Engineering")
                .team(request.getTeam() != null ? request.getTeam().trim() : "Core Team")
                .designation(request.getDesignation() != null ? request.getDesignation().trim() : "Engineering Manager")
                .manager(reportingManager)
                .joiningDate(request.getJoiningDate() != null ? request.getJoiningDate() : LocalDate.now())
                .accountStatus("ACTIVE")
                .role(Role.ROLE_MANAGER)
                .build();

        Employee saved = employeeRepository.save(manager);

        // Send welcome email with login credentials
        emailService.sendWelcomeEmail(saved.getEmail(), saved.getName(), request.getPassword(), "Manager");

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Manager created successfully. Welcome email with login details has been sent.",
                "id", saved.getId(),
                "name", saved.getName(),
                "email", saved.getEmail()
        ));
    }

    // 5. Employee Directory
    @GetMapping("/employees")
    public ResponseEntity<List<EmployeeDto>> getAllEmployees() {
        List<Employee> allEmployees = employeeRepository.findAll();

        List<EmployeeDto> dtoList = allEmployees.stream()
                .map(e -> EmployeeDto.builder()
                        .id(e.getId())
                        .employeeCode("EMP-" + e.getId())
                        .name(e.getName())
                        .email(e.getEmail())
                        .role(e.getRole() != null ? e.getRole().name().replace("ROLE_", "") : "EMPLOYEE")
                        .department(e.getDepartment() != null ? e.getDepartment() : "-")
                        .designation(e.getDesignation() != null ? e.getDesignation() : "-")
                        .team(e.getTeam() != null ? e.getTeam() : "-")
                        .managerId(e.getManager() != null ? e.getManager().getId() : null)
                        .managerName(e.getManager() != null ? e.getManager().getName() : "-")
                        .joiningDate(e.getJoiningDate())
                        .accountStatus(e.getAccountStatus() != null ? e.getAccountStatus() : "ACTIVE")
                        .build()
                )
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }

    // 6. Create Employee (with Auto KPI Assignment)
    @PostMapping("/employees")
    @Transactional
    public ResponseEntity<Map<String, Object>> createEmployee(@RequestBody CreateEmployeeRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String name = request.getEffectiveName();

        if (email.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email address is required.");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password is required.");
        }

        if (employeeRepository.findByEmail(email).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email already exists in the system.");
        }

        Employee reportingManager = null;
        if (request.getManagerId() != null) {
            reportingManager = employeeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Selected reporting manager does not exist."));
        }

        Role role = Role.ROLE_EMPLOYEE;
        if (request.getRole() != null && (request.getRole().equalsIgnoreCase("MANAGER") || request.getRole().equalsIgnoreCase("ROLE_MANAGER"))) {
            role = Role.ROLE_MANAGER;
        }

        String designation = request.getDesignation();
        if (designation == null || designation.trim().isEmpty()) {
            designation = "Software Engineer";
        }

        String department = request.getDepartment();
        if (department == null || department.trim().isEmpty()) {
            department = "Engineering";
        }

        Employee employee = Employee.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .department(department.trim())
                .team(request.getTeam() != null ? request.getTeam().trim() : "Core Platform")
                .designation(designation.trim())
                .manager(reportingManager)
                .joiningDate(request.getJoiningDate() != null ? request.getJoiningDate() : LocalDate.now())
                .accountStatus("ACTIVE")
                .role(role)
                .build();

        Employee saved = employeeRepository.save(employee);

        // Auto-assign active PMS cycle & clone KPIs from KpiMaster
        PmsAssignment assignment = PmsAssignment.builder()
                .employee(saved)
                .cycleMonth("August 2026")
                .status(PMSState.SELF_ASSESSMENT_DRAFT)
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .submissionDeadline(LocalDate.of(2026, 9, 10))
                .build();
        pmsAssignmentRepository.save(assignment);

        List<KpiMaster> masterKpis = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus(designation.trim(), "ACTIVE");
        if (masterKpis.isEmpty()) {
            // Fallback to generic software engineer if designation not found
            masterKpis = kpiMasterRepository.findByDesignationIgnoreCaseAndStatus("Software Engineer", "ACTIVE");
        }

        List<PmsKpi> assignedKpis = new ArrayList<>();
        for (KpiMaster km : masterKpis) {
            PmsKpi k = PmsKpi.builder()
                    .assignment(assignment)
                    .kpiName(km.getKpiName())
                    .description(km.getDescription())
                    .weightage(km.getWeightage())
                    .build();
            assignedKpis.add(k);
        }
        if (!assignedKpis.isEmpty()) {
            pmsKpiRepository.saveAll(assignedKpis);
        }

        // Send welcome email with login credentials
        emailService.sendWelcomeEmail(saved.getEmail(), saved.getName(), request.getPassword(), saved.getRole() == Role.ROLE_MANAGER ? "Manager" : "Employee");

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Employee created and KPIs assigned successfully. Welcome email with login details has been sent.",
                "id", saved.getId(),
                "name", saved.getName(),
                "email", saved.getEmail(),
                "designation", saved.getDesignation(),
                "assignedKpisCount", assignedKpis.size()
        ));
    }

    // Update Employee (Promote to Manager, Change Designation, Department, Manager)
    @PutMapping("/employees/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateEmployee(@PathVariable Long id, @RequestBody UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found."));

        if (request.getEffectiveName() != null) {
            employee.setName(request.getEffectiveName());
        }
        if (request.getDesignation() != null && !request.getDesignation().trim().isEmpty()) {
            employee.setDesignation(request.getDesignation().trim());
        }
        if (request.getDepartment() != null && !request.getDepartment().trim().isEmpty()) {
            employee.setDepartment(request.getDepartment().trim());
        }
        if (request.getTeam() != null && !request.getTeam().trim().isEmpty()) {
            employee.setTeam(request.getTeam().trim());
        }
        if (request.getAccountStatus() != null && !request.getAccountStatus().trim().isEmpty()) {
            employee.setAccountStatus(request.getAccountStatus().trim());
        }
        if (request.getRole() != null) {
            String roleStr = request.getRole().trim().toUpperCase();
            if (roleStr.contains("MANAGER")) {
                employee.setRole(Role.ROLE_MANAGER);
            } else if (roleStr.contains("HR")) {
                employee.setRole(Role.ROLE_HR);
            } else {
                employee.setRole(Role.ROLE_EMPLOYEE);
            }
        }
        if (request.getManagerId() != null) {
            if (request.getManagerId() == 0 || request.getManagerId() == -1) {
                employee.setManager(null);
            } else {
                Employee mgr = employeeRepository.findById(request.getManagerId())
                        .orElse(null);
                employee.setManager(mgr);
            }
        }

        Employee saved = employeeRepository.save(employee);

        return ResponseEntity.ok(Map.of(
                "message", "Employee updated successfully.",
                "id", saved.getId(),
                "name", saved.getName(),
                "role", saved.getRole().name().replace("ROLE_", ""),
                "designation", saved.getDesignation() != null ? saved.getDesignation() : "-",
                "department", saved.getDepartment() != null ? saved.getDepartment() : "-"
        ));
    }

    // Delete Employee and all associated records
    @DeleteMapping("/employees/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> deleteEmployee(@PathVariable Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found."));

        // 1. Unassign manager reference from direct reports
        List<Employee> subordinates = employeeRepository.findByManager(employee);
        for (Employee sub : subordinates) {
            sub.setManager(null);
        }
        if (!subordinates.isEmpty()) {
            employeeRepository.saveAll(subordinates);
        }

        // 2. Delete review records where this employee was the reviewer
        List<EmployeeReview> allReviews = employeeReviewRepository.findAll();
        for (EmployeeReview r : allReviews) {
            if (r.getReviewer() != null && r.getReviewer().getId().equals(id)) {
                employeeReviewRepository.delete(r);
            }
        }

        // 3. Delete PMS assignments and their associated ratings, reviews, and KPIs
        List<PmsAssignment> assignments = pmsAssignmentRepository.findByEmployee(employee);
        for (PmsAssignment a : assignments) {
            finalPmsResultRepository.findByAssignment(a).ifPresent(finalPmsResultRepository::delete);
            List<EmployeeKpiRating> ratings = employeeKpiRatingRepository.findByAssignment(a);
            employeeKpiRatingRepository.deleteAll(ratings);
            List<EmployeeReview> reviews = employeeReviewRepository.findByAssignment(a);
            employeeReviewRepository.deleteAll(reviews);
            List<PmsKpi> kpis = pmsKpiRepository.findByAssignment(a);
            pmsKpiRepository.deleteAll(kpis);
            pmsAssignmentRepository.delete(a);
        }

        // 4. Delete PMS history
        List<PmsHistory> history = pmsHistoryRepository.findByEmployee(employee);
        if (!history.isEmpty()) {
            pmsHistoryRepository.deleteAll(history);
        }

        // 5. Delete employee record
        employeeRepository.delete(employee);

        return ResponseEntity.ok(Map.of(
                "message", "Employee " + employee.getName() + " deleted successfully.",
                "id", id
        ));
    }

    // 7. KPI Master CRUD Endpoints
    @GetMapping("/kpis")
    public ResponseEntity<List<KpiMasterDto>> getKpiMasterList(@RequestParam(required = false) String designation) {
        List<KpiMasterDto> list = hrKpiService.getKpisByDesignation(designation);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/kpis")
    public ResponseEntity<KpiMasterDto> createKpi(@Valid @RequestBody CreateKpiMasterRequest request) {
        KpiMasterDto created = hrKpiService.createKpi(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/kpis/{id}")
    public ResponseEntity<KpiMasterDto> updateKpi(@PathVariable Long id, @Valid @RequestBody UpdateKpiMasterRequest request) {
        KpiMasterDto updated = hrKpiService.updateKpi(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/kpis/{id}")
    public ResponseEntity<Void> deleteKpi(@PathVariable Long id) {
        hrKpiService.deleteKpi(id);
        return ResponseEntity.noContent().build();
    }

    // 8. Lifecycle Search & Detail
    @GetMapping("/lifecycle/employees")
    public ResponseEntity<List<EmployeeDto>> searchLifecycleEmployees(@RequestParam(required = false) String query) {
        List<EmployeeDto> list = hrLifecycleService.searchEmployees(query);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/lifecycle/{employeeId}")
    public ResponseEntity<Map<String, Object>> getLifecycleDetail(@PathVariable Long employeeId) {
        Map<String, Object> data = hrLifecycleService.getEmployeeLifecycle(employeeId);
        return ResponseEntity.ok(data);
    }

    // HR Edit KPI Ratings and Comments
    @PutMapping("/lifecycle/{assignmentId}/ratings")
    public ResponseEntity<Map<String, Object>> updateKpiRatings(
            @PathVariable Long assignmentId,
            @RequestBody HrUpdateKpiRatingsRequest request) {
        Map<String, Object> result = hrLifecycleService.updateKpiRatingsAndComments(assignmentId, request);
        return ResponseEntity.ok(result);
    }

    // 9. HR Finalise and Submit
    @PostMapping("/lifecycle/{assignmentId}/finalize")
    public ResponseEntity<Map<String, Object>> finalizePms(
            @PathVariable Long assignmentId,
            @RequestBody HrFinalizeRequest request,
            @AuthenticationPrincipal UserPrincipal hrUser) {
        Map<String, Object> result = hrLifecycleService.finalizePms(assignmentId, hrUser.getId(), request);
        return ResponseEntity.ok(result);
    }

    // 10. Reports Summary
    @GetMapping("/reports/summary")
    public ResponseEntity<HrReportSummaryDto> getReportsSummary() {
        HrReportSummaryDto summary = hrLifecycleService.getRatingCategorySummary();
        return ResponseEntity.ok(summary);
    }

    // 11. Reports Download
    @GetMapping("/reports/download")
    public ResponseEntity<byte[]> downloadReport(
            @RequestParam Long assignmentId,
            @RequestParam(defaultValue = "pdf") String format,
            @AuthenticationPrincipal UserPrincipal hrUser) throws IOException {

        byte[] data;
        String filename;
        MediaType mediaType;

        if ("excel".equalsIgnoreCase(format)) {
            data = reportService.generateExcelReport(hrUser.getId(), assignmentId);
            filename = "HR_PMS_Report_" + assignmentId + ".xlsx";
            mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            data = reportService.generatePdfReport(hrUser.getId(), assignmentId);
            filename = "HR_PMS_Report_" + assignmentId + ".pdf";
            mediaType = MediaType.APPLICATION_PDF;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(data);
    }
}
