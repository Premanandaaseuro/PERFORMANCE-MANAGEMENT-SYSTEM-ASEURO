# HR Service

## Overview
This service manages HR administration workflows, including organization-wide KPI master creation, designation KPI assignment, employee & reporting manager onboarding, lifecycle appraisal finalization, rating overrides, and PDF/Excel report exports.

## Components Included
- **Frontend:** `HrDashboardPage.tsx`, `HrAddEmployeePage.tsx`, `HrEmployeeDirectoryPage.tsx`, `HrKpisPage.tsx`, `HrManagersPage.tsx`, `HrPmsLifecyclePage.tsx`, `HrReportsPage.tsx`, `hrApi.ts`, `reportApi.ts`
- **Backend:** `HrManagementController.java`, `ReportController.java`, `HrKpiService.java`, `HrLifecycleService.java`, `ReportService.java`
- **Database Schema:** `04_hr_management_schema.sql` (`kpi_master`, `final_pms_result`)
- **Docker:** `docker/Dockerfile`

## Managed APIs
- `GET /api/hr/dashboard` - Get organization appraisal metrics & status breakdown
- `GET /api/hr/designations` - Fetch designations list for KPI mapping
- `GET /api/hr/managers` / `POST /api/hr/managers` - Manage reporting manager assignments
- `GET /api/hr/employees` / `POST /api/hr/employees` - Employee directory search & creation
- `GET /api/hr/kpis` / `POST /api/hr/kpis` / `PUT /api/hr/kpis/:id` - Manage 12 standard KPI weightages
- `GET /api/hr/lifecycle/employees` / `POST /api/hr/lifecycle/:assignmentId/finalize` - Track & finalize appraisals
- `GET /api/hr/reports/summary` / `GET /api/hr/reports/download` - Download PDF & Excel report documents
