# Database Organization & Schema Segregation

## Overview
This directory organizes PostgreSQL database definitions into service-owned schema files (`login`, `employee`, `manager`, `hr`), migrations, and seed data.

## Directory Structure
- **`schema/login/`**: `01_employee_auth.sql` (User table, passwords, roles, avatars)
- **`schema/employee/`**: `02_pms_assignment.sql` (Assignments, KPIs, ratings, history)
- **`schema/manager/`**: `03_employee_review.sql` (Manager evaluations & reviews)
- **`schema/hr/`**: `04_kpi_master.sql` (Master KPIs & Final PMS results)
- **`seed/`**: `02_seed_standard_kpis.sql` (12 standard Goals & KPIs totaling 100%)
- **`migrations/`**: Database initialization & version upgrade scripts
