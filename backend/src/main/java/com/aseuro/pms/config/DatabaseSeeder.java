package com.aseuro.pms.config;

import com.aseuro.pms.model.*;
import com.aseuro.pms.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final PmsAssignmentRepository pmsAssignmentRepository;
    private final PmsKpiRepository pmsKpiRepository;
    private final EmployeeKpiRatingRepository employeeKpiRatingRepository;
    private final EmployeeReviewRepository employeeReviewRepository;
    private final FinalPmsResultRepository finalPmsResultRepository;
    private final PmsHistoryRepository pmsHistoryRepository;
    private final KpiMasterRepository kpiMasterRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(
            EmployeeRepository employeeRepository,
            PmsAssignmentRepository pmsAssignmentRepository,
            PmsKpiRepository pmsKpiRepository,
            EmployeeKpiRatingRepository employeeKpiRatingRepository,
            EmployeeReviewRepository employeeReviewRepository,
            FinalPmsResultRepository finalPmsResultRepository,
            PmsHistoryRepository pmsHistoryRepository,
            KpiMasterRepository kpiMasterRepository,
            PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.pmsAssignmentRepository = pmsAssignmentRepository;
        this.pmsKpiRepository = pmsKpiRepository;
        this.employeeKpiRatingRepository = employeeKpiRatingRepository;
        this.employeeReviewRepository = employeeReviewRepository;
        this.finalPmsResultRepository = finalPmsResultRepository;
        this.pmsHistoryRepository = pmsHistoryRepository;
        this.kpiMasterRepository = kpiMasterRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        seedKpiMasterData();

        if (employeeRepository.count() > 0) {
            // Ensure HR user exists with correct password Hr@12345
            employeeRepository.findByEmail("hr@aseuro.com").ifPresent(hr -> {
                hr.setPassword(passwordEncoder.encode("Hr@12345"));
                hr.setRole(Role.ROLE_HR);
                employeeRepository.save(hr);
            });

            // Ensure August 2026 active assignments have the 12 standard KPIs
            List<PmsAssignment> activeAssignments = pmsAssignmentRepository.findAll();
            for (PmsAssignment a : activeAssignments) {
                if ("August 2026".equals(a.getCycleMonth())) {
                    List<PmsKpi> currentKpis = pmsKpiRepository.findByAssignment(a);
                    boolean has12 = currentKpis.stream().anyMatch(k -> "Sprint Task Completion".equalsIgnoreCase(k.getKpiName()));
                    if (!has12) {
                        employeeKpiRatingRepository.deleteAll(employeeKpiRatingRepository.findByAssignment(a));
                        pmsKpiRepository.deleteAll(currentKpis);
                        create12StandardKpisForAssignment(a);
                    }
                }
            }
            return;
        }

        // 1. Create Users
        Employee hr = Employee.builder()
                .email("hr@aseuro.com")
                .password(passwordEncoder.encode("Hr@12345"))
                .name("Bob HR")
                .department("Human Resources")
                .designation("HR Director")
                .joiningDate(LocalDate.of(2022, 1, 15))
                .accountStatus("ACTIVE")
                .role(Role.ROLE_HR)
                .build();
        employeeRepository.save(hr);

        Employee manager = Employee.builder()
                .email("manager@aseuro.com")
                .password(passwordEncoder.encode("password"))
                .name("Alice Smith")
                .department("Engineering")
                .team("Core Platform")
                .designation("Engineering Manager")
                .joiningDate(LocalDate.of(2021, 6, 1))
                .accountStatus("ACTIVE")
                .role(Role.ROLE_MANAGER)
                .build();
        employeeRepository.save(manager);

        Employee employee = Employee.builder()
                .email("employee@aseuro.com")
                .password(passwordEncoder.encode("password"))
                .name("John Doe")
                .department("Engineering")
                .team("Core Platform")
                .designation("Software Engineer")
                .manager(manager)
                .joiningDate(LocalDate.of(2023, 3, 10))
                .accountStatus("ACTIVE")
                .role(Role.ROLE_EMPLOYEE)
                .build();
        employeeRepository.save(employee);

        // 2. Create Active PMS Assignment for Manager (Alice Smith) for August 2026
        PmsAssignment managerAssignment = PmsAssignment.builder()
                .employee(manager)
                .cycleMonth("August 2026")
                .status(PMSState.SELF_ASSESSMENT_DRAFT)
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .submissionDeadline(LocalDate.of(2026, 8, 25))
                .build();
        pmsAssignmentRepository.save(managerAssignment);
        create12StandardKpisForAssignment(managerAssignment);

        // Create Active PMS Assignment for Employee (John Doe) for August 2026 (Fresh Self-Assessment Draft)
        PmsAssignment currentAssignment = PmsAssignment.builder()
                .employee(employee)
                .cycleMonth("August 2026")
                .status(PMSState.SELF_ASSESSMENT_DRAFT)
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .submissionDeadline(LocalDate.of(2026, 8, 25))
                .build();
        pmsAssignmentRepository.save(currentAssignment);
        create12StandardKpisForAssignment(currentAssignment);

        // 3. Seed history (July 2026)
        PmsAssignment julyAssignment = PmsAssignment.builder()
                .employee(employee)
                .cycleMonth("July 2026")
                .status(PMSState.COMPLETED)
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 7, 31))
                .finalizedDate(LocalDate.of(2026, 7, 28))
                .overallScore(4.25)
                .performanceGrade("Excellent Performance")
                .build();
        pmsAssignmentRepository.save(julyAssignment);

        PmsKpi julyKpi1 = PmsKpi.builder()
                .assignment(julyAssignment)
                .kpiName("Sprint Goal Achievement")
                .description("Successfully completed all assigned sprint goals.")
                .weightage(40.0)
                .build();
        pmsKpiRepository.save(julyKpi1);

        EmployeeKpiRating julyRating1 = EmployeeKpiRating.builder()
                .assignment(julyAssignment)
                .kpi(julyKpi1)
                .selfRating(4.5)
                .comments("Delivered high performance features ahead of deadlines.")
                .build();
        employeeKpiRatingRepository.save(julyRating1);

        EmployeeReview julyReview = EmployeeReview.builder()
                .assignment(julyAssignment)
                .reviewer(manager)
                .comments("Exceptional velocity and dependable work throughout July.")
                .reviewDate(LocalDate.of(2026, 7, 26))
                .build();
        employeeReviewRepository.save(julyReview);

        FinalPmsResult julyResult = FinalPmsResult.builder()
                .assignment(julyAssignment)
                .finalScore(4.25)
                .grade("Excellent Performance")
                .finalizedBy(hr)
                .finalizedDate(LocalDate.of(2026, 7, 28))
                .build();
        finalPmsResultRepository.save(julyResult);

        PmsHistory julyHistory = PmsHistory.builder()
                .employee(employee)
                .cycleMonth("July 2026")
                .finalScore(4.25)
                .grade("Excellent Performance")
                .finalizedDate(LocalDate.of(2026, 7, 28))
                .assignmentId(julyAssignment.getId())
                .build();
        pmsHistoryRepository.save(julyHistory);

        // 4. Seed history (June 2026)
        PmsAssignment juneAssignment = PmsAssignment.builder()
                .employee(employee)
                .cycleMonth("June 2026")
                .status(PMSState.COMPLETED)
                .startDate(LocalDate.of(2026, 6, 1))
                .endDate(LocalDate.of(2026, 6, 30))
                .finalizedDate(LocalDate.of(2026, 6, 28))
                .overallScore(3.90)
                .performanceGrade("Good Performance")
                .build();
        pmsAssignmentRepository.save(juneAssignment);

        PmsHistory juneHistory = PmsHistory.builder()
                .employee(employee)
                .cycleMonth("June 2026")
                .finalScore(3.90)
                .grade("Good Performance")
                .finalizedDate(LocalDate.of(2026, 6, 28))
                .assignmentId(juneAssignment.getId())
                .build();
        pmsHistoryRepository.save(juneHistory);

        // 5. Seed history (May 2026)
        PmsAssignment mayAssignment = PmsAssignment.builder()
                .employee(employee)
                .cycleMonth("May 2026")
                .status(PMSState.COMPLETED)
                .startDate(LocalDate.of(2026, 5, 1))
                .endDate(LocalDate.of(2026, 5, 31))
                .finalizedDate(LocalDate.of(2026, 5, 28))
                .overallScore(4.10)
                .performanceGrade("Excellent Performance")
                .build();
        pmsAssignmentRepository.save(mayAssignment);

        PmsHistory mayHistory = PmsHistory.builder()
                .employee(employee)
                .cycleMonth("May 2026")
                .finalScore(4.10)
                .grade("Excellent Performance")
                .finalizedDate(LocalDate.of(2026, 5, 28))
                .assignmentId(mayAssignment.getId())
                .build();
        pmsHistoryRepository.save(mayHistory);
    }

    private void create12StandardKpisForAssignment(PmsAssignment assignment) {
        List<PmsKpi> kpis = List.of(
                PmsKpi.builder().assignment(assignment).kpiName("Sprint Task Completion").description("Sprint Task Completion - tasks completed within sprint (individual)").weightage(10.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("Deadline Adherence").description("Deadline Adherence - tasks completed on or before deadline").weightage(15.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("Task Quality with Defects").description("Task Quality with Defects - tasks delivered without defects, including reopen and critical issues").weightage(10.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("Prompt Quality").description("Prompt Quality - AI tasks with minimal rework").weightage(15.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("Jira Time Logging").description("Jira Time Logging - days logged properly in Jira").weightage(10.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("Jira Discipline").description("Jira Discipline - status updates, comments, transitions, and ticket hygiene").weightage(5.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("Accountability & Ownership").description("Accountability & Ownership - proactive ownership, updates, issue handling, team collaboration, and engagement").weightage(10.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("Leave Pattern").description("Leave Pattern - planned leaves should be 95% of total leaves; unplanned leaves should not exceed 5% in a year including sick leave; sick leave every month for more than two days requires a medical certificate").weightage(5.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("Team Collaboration and Engagement").description("Team Collaboration and Engagement").weightage(5.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("Punctuality").description("Punctuality").weightage(5.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("New Initiatives and Participation").description("New Initiatives and Participation").weightage(5.0).build(),
                PmsKpi.builder().assignment(assignment).kpiName("Rewards").description("Rewards").weightage(5.0).build()
        );
        pmsKpiRepository.saveAll(kpis);
    }

    private void seedKpiMasterData() {
        boolean hasExact12 = kpiMasterRepository.findAll().stream()
                .anyMatch(k -> "Sprint Task Completion".equalsIgnoreCase(k.getKpiName()));

        if (hasExact12 && kpiMasterRepository.count() > 0) {
            return;
        }

        kpiMasterRepository.deleteAll();

        List<String> designations = List.of(
                "Software Engineer",
                "Senior Software Engineer",
                "Tech Lead",
                "Engineering Manager",
                "QA Engineer"
        );

        for (String des : designations) {
            // Technical / Custom KPIs (75% Total)
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Sprint Task Completion").description("Sprint Task Completion - tasks completed within sprint (individual)").weightage(10.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Deadline Adherence").description("Deadline Adherence - tasks completed on or before deadline").weightage(15.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Task Quality with Defects").description("Task Quality with Defects - tasks delivered without defects, including reopen and critical issues").weightage(10.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Prompt Quality").description("Prompt Quality - AI tasks with minimal rework").weightage(15.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Jira Time Logging").description("Jira Time Logging - days logged properly in Jira").weightage(10.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Jira Discipline").description("Jira Discipline - status updates, comments, transitions, and ticket hygiene").weightage(5.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Accountability & Ownership").description("Accountability & Ownership - proactive ownership, updates, issue handling, team collaboration, and engagement").weightage(10.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());

            // Standardized HR Rating / Organizational Hygiene KPIs (25% Total)
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Leave Pattern").description("Leave Pattern - planned leaves should be 95% of total leaves; unplanned leaves should not exceed 5% in a year including sick leave; sick leave every month for more than two days requires a medical certificate").weightage(5.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Team Collaboration and Engagement").description("Team Collaboration and Engagement").weightage(5.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Punctuality").description("Punctuality").weightage(5.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("New Initiatives and Participation").description("New Initiatives and Participation").weightage(5.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
            kpiMasterRepository.save(KpiMaster.builder().designation(des).kpiName("Rewards").description("Rewards").weightage(5.0).selfRatingScale("1.0 - 5.0 Rating Scale").managerRatingScale("1.0 - 5.0 Rating Scale").status("ACTIVE").build());
        }
    }
}
