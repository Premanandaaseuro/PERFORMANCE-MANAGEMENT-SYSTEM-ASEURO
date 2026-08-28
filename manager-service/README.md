# Manager Service

## Overview
This service handles manager workflows, including team dashboard review metrics, direct report employee evaluation lists, KPI rating reviews & scoring, manager comment submissions, personal manager self-appraisals, and team reports.

## Components Included
- **Frontend:** `ManagerDashboardPage.tsx`, `ManagerEmployeesPage.tsx`, `ManagerKpiReviewPage.tsx`, `ManagerMyKpisPage.tsx`, `ManagerReportsPage.tsx`, `managerApi.ts`
- **Backend:** `ManagerController.java`, `ManagerService.java`
- **Database Schema:** `03_manager_review_schema.sql` (`employee_review`)
- **Docker:** `docker/Dockerfile`

## Managed APIs
- `GET /api/manager/dashboard` - Get manager team overview & review status counters
- `GET /api/manager/assigned-employees` - List direct reports assigned for appraisal
- `GET /api/manager/employees/:employeeId/review` - View employee self-ratings for evaluation
- `POST /api/manager/employees/:employeeId/review` - Submit manager KPI ratings & overall feedback
- `GET /api/manager/my-kpis` - Access personal manager KPI self-assessment
- `GET /api/manager/reports` - Retrieve team performance summary report metrics
