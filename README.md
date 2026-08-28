# PERFORMANCE MANAGEMENT SYSTEM (APMS) - Microservice-Ready Architecture

## Architecture Overview
The APMS application is structured into clearly separated service and domain modules, paving a microservice-ready folder organization while maintaining 100% operational compatibility for unified monolith and Docker deployment.

```text
APMS/
│
├── login-service/        # Authentication, JWT token issuance, User credentials & Profile UI
├── employee-service/     # Self-assessment, personal KPI ratings, draft saving & submit UI
├── manager-service/      # Team overview dashboard, employee reviews, manager scoring UI
├── hr-service/           # Master 12 KPI management, onboarding, lifecycle finalization & report PDF/Excel UI
├── database/             # Service-owned schemas (login, employee, manager, hr), seed & migrations
├── docker/               # Container orchestration (docker-compose.yml)
├── shared/               # Cross-cutting TypeScript types, constants & scoring utilities
└── README.md
```

## Services & Functionality Mapping

### 1. Login Service (`login-service`)
- **APIs:** `POST /api/auth/login`, `GET /employee/profile`, `PUT /employee/profile`
- **Frontend Pages:** `Login.tsx`, `Profile.tsx`
- **Backend Components:** `AuthController`, `AuthService`, `SecurityConfig`, `JwtAuthenticationFilter`, `CustomUserDetailsService`
- **Database Table:** `employee`

### 2. Employee Service (`employee-service`)
- **APIs:** `GET /api/pms/dashboard`, `GET /api/pms/my-kpis`, `POST /api/pms/my-kpis/ratings`, `POST /api/pms/my-kpis/submit`, `GET /api/pms/history`
- **Frontend Pages:** `MyKpis.tsx`, `Dashboard.tsx`, `PmsHistoryPage.tsx`, `HistoryDetail.tsx`
- **Backend Components:** `PmsController`, `EmployeeController`, `PmsService`, `EmployeeService`
- **Database Tables:** `pms_assignment`, `pms_kpi`, `employee_kpi_rating`, `pms_history`

### 3. Manager Service (`manager-service`)
- **APIs:** `GET /api/manager/dashboard`, `GET /api/manager/assigned-employees`, `GET /api/manager/employees/:id/review`, `POST /api/manager/employees/:id/review`
- **Frontend Pages:** `ManagerDashboardPage.tsx`, `ManagerEmployeesPage.tsx`, `ManagerKpiReviewPage.tsx`, `ManagerMyKpisPage.tsx`, `ManagerReportsPage.tsx`
- **Backend Components:** `ManagerController`, `ManagerService`
- **Database Table:** `employee_review`

### 4. HR Service (`hr-service`)
- **APIs:** `GET /api/hr/dashboard`, `GET /api/hr/kpis`, `POST /api/hr/kpis`, `GET /api/hr/lifecycle/employees`, `POST /api/hr/lifecycle/:id/finalize`, `GET /api/hr/reports/download`
- **Frontend Pages:** `HrDashboardPage.tsx`, `HrAddEmployeePage.tsx`, `HrEmployeeDirectoryPage.tsx`, `HrKpisPage.tsx`, `HrManagersPage.tsx`, `HrPmsLifecyclePage.tsx`, `HrReportsPage.tsx`
- **Backend Components:** `HrManagementController`, `ReportController`, `HrKpiService`, `HrLifecycleService`, `ReportService`
- **Database Tables:** `kpi_master`, `final_pms_result`

---

## Single-Click Launchers (One-Click Runners)

You can run the entire application stack or the Spring Boot JAR file with a single click or command:

### 1. Unified Single Runner (`run.bat`)
Double-click [`run.bat`](file:///c:/Users/MPremananda/Pictures/FINAL%20PMS%20DEVPOLOMENT/PMS-ASEURO/PMS-ASEURO/run.bat) or run from terminal:
```cmd
run.bat
```
Provides options to:
- **Option 1:** Launch full stack (Frontend, Backend container, Database, PgAdmin)
- **Option 2:** Run compiled Spring Boot JAR file directly (`java -jar backend/target/pms-1.0.0.jar`)
- **Option 3:** Rebuild Spring Boot JAR file (`pms-1.0.0.jar`)
- **Option 4:** Stop all running services

### 2. Dedicated JAR Runner (`run-jar.bat`)
Double-click [`run-jar.bat`](file:///c:/Users/MPremananda/Pictures/FINAL%20PMS%20DEVPOLOMENT/PMS-ASEURO/PMS-ASEURO/run-jar.bat) to launch PostgreSQL in Docker and directly execute the backend Spring Boot `.jar` file:
```cmd
run-jar.bat
```

### 3. Linux / macOS Runner (`run.sh`)
```bash
chmod +x run.sh
./run.sh
```

---

## Application Access Endpoints
- **Frontend URL:** [http://localhost](http://localhost)
- **Backend API:** [http://localhost:8081](http://localhost:8081)
- **Swagger Documentation:** [http://localhost:8081/swagger-ui/index.html](http://localhost:8081/swagger-ui/index.html)
- **pgAdmin URL:** [http://localhost:5050](http://localhost:5050)

