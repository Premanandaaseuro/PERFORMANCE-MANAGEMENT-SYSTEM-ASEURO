# Employee Service

## Overview
This service manages employee self-assessment workflows, personal KPI self-rating entries, draft saving, appraisal submission, and historical PMS performance records.

## Components Included
- **Frontend:** `MyKpis.tsx`, `Dashboard.tsx`, `PmsHistoryPage.tsx`, `HistoryDetail.tsx`, `employeeApi.ts`, `pmsApi.ts`
- **Backend:** `PmsController.java`, `EmployeeController.java`, `PmsService.java`, `EmployeeService.java`
- **Database Schema:** `02_employee_pms_schema.sql` (`pms_assignment`, `pms_kpi`, `employee_kpi_rating`, `pms_history`)
- **Docker:** `docker/Dockerfile`

## Managed APIs
- `GET /api/pms/dashboard` - Get active self-assessment cycle status
- `GET /api/pms/my-kpis` - Fetch assigned KPIs & self-rating scores
- `POST /api/pms/my-kpis/ratings` - Save self-ratings & comments in draft state
- `POST /api/pms/my-kpis/submit` - Submit self-assessment to manager for review
- `GET /api/pms/history` - Retrieve historical PMS appraisal scores and grades
- `GET /api/pms/history/:assignmentId` - View historic evaluation details
