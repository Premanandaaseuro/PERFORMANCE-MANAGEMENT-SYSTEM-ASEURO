# Performance Management System (PMS) - Test Cases Specification

This document details all test cases automated inside the Playwright testing suite.

---

### Authentication Module

#### `AUTH-001`
* **Module**: Authentication
* **Role**: HR
* **Scenario**: Valid HR login and redirect to HR dashboard
* **Precondition**: HR user exists in database (`m.premananda@aseuro.in`)
* **Steps**:
  1. Navigate to `/login`.
  2. Input valid HR email and password.
  3. Click "Sign in" button.
* **Expected Result**: Successfully redirected to `/hr/dashboard`.
* **Automation File**: `tests/auth/auth.spec.ts`
* **Priority**: P0
* **Type**: Functional / E2E

#### `AUTH-002`
* **Module**: Authentication
* **Role**: Manager
* **Scenario**: Valid Manager login and redirect to Manager dashboard
* **Precondition**: Manager user exists in database (`manager@aseuro.in`)
* **Steps**:
  1. Navigate to `/login`.
  2. Input valid Manager email and password.
  3. Click "Sign in" button.
* **Expected Result**: Successfully redirected to `/manager/dashboard`.
* **Automation File**: `tests/auth/auth.spec.ts`
* **Priority**: P0
* **Type**: Functional / E2E

#### `AUTH-003`
* **Module**: Authentication
* **Role**: Employee
* **Scenario**: Valid Employee login and redirect to Employee dashboard
* **Precondition**: Employee user exists in database (`emp@aseuro.in`)
* **Steps**:
  1. Navigate to `/login`.
  2. Input valid Employee email and password.
  3. Click "Sign in" button.
* **Expected Result**: Successfully redirected to `/dashboard`.
* **Automation File**: `tests/auth/auth.spec.ts`
* **Priority**: P0
* **Type**: Functional / E2E

#### `AUTH-004`
* **Module**: Authentication
* **Role**: Unauthenticated
* **Scenario**: Invalid credentials display alert
* **Precondition**: None
* **Steps**:
  1. Navigate to `/login`.
  2. Enter invalid email and password.
  3. Click "Sign in".
* **Expected Result**: Error notification/alert is displayed; remains on `/login`.
* **Automation File**: `tests/auth/auth.spec.ts`
* **Priority**: P0
* **Type**: Negative

#### `AUTH-005`
* **Module**: Authentication
* **Role**: Unauthenticated
* **Scenario**: Blank input validation
* **Precondition**: None
* **Steps**:
  1. Navigate to `/login`.
  2. Leave fields blank and submit.
* **Expected Result**: Validation warning prevents submission; user remains on `/login`.
* **Automation File**: `tests/auth/auth.spec.ts`
* **Priority**: P1
* **Type**: Validation

#### `AUTH-006`
* **Module**: Authentication
* **Role**: Attacker
* **Scenario**: SQL Injection in credentials
* **Precondition**: None
* **Steps**:
  1. Navigate to `/login`.
  2. Enter SQL payload `' OR '1'='1` in email and password fields.
  3. Submit login.
* **Expected Result**: Input is sanitized, backend safely rejects with 401 Unauthorized.
* **Automation File**: `tests/auth/auth.spec.ts`
* **Priority**: P0
* **Type**: Security

#### `AUTH-007`
* **Module**: Authentication
* **Role**: Attacker
* **Scenario**: XSS Payload in login input
* **Precondition**: None
* **Steps**:
  1. Navigate to `/login`.
  2. Enter `<script>alert('xss')</script>` in email input.
  3. Submit login.
* **Expected Result**: Script tag is escaped and rejected without execution.
* **Automation File**: `tests/auth/auth.spec.ts`
* **Priority**: P0
* **Type**: Security

#### `AUTH-008`
* **Module**: Authentication
* **Role**: Any
* **Scenario**: Password toggle visibility
* **Precondition**: None
* **Steps**:
  1. Enter text in password input.
  2. Click password toggle eye icon.
* **Expected Result**: Input type changes between `password` and `text`.
* **Automation File**: `tests/auth/auth.spec.ts`
* **Priority**: P2
* **Type**: UI

#### `AUTH-009`
* **Module**: Authentication
* **Role**: Unauthenticated
* **Scenario**: Direct navigation to protected URL redirects to `/login`
* **Precondition**: Unauthenticated browser context
* **Steps**:
  1. Navigate directly to `/hr/dashboard`.
* **Expected Result**: Redirected to `/login`.
* **Automation File**: `tests/auth/auth.spec.ts`
* **Priority**: P0
* **Type**: Security / Lifecycle

---

### HR Module

#### `HR-001`
* **Module**: HR Management
* **Role**: HR
* **Scenario**: HR Dashboard renders metric statistics
* **Precondition**: Logged in as HR
* **Steps**:
  1. Navigate to `/hr/dashboard`.
* **Expected Result**: Dashboard loads with stat cards (Total Employees, Active PMS Cycles, etc.).
* **Automation File**: `tests/hr/hr-workflow.spec.ts`
* **Priority**: P1
* **Type**: Functional / UI

#### `HR-002`
* **Module**: HR Management
* **Role**: HR
* **Scenario**: Search and filter in HR Employee Directory
* **Precondition**: Logged in as HR
* **Steps**:
  1. Navigate to `/hr/employees`.
  2. Enter employee name query in search bar.
* **Expected Result**: Employee directory filters matching records dynamically.
* **Automation File**: `tests/hr/hr-workflow.spec.ts`
* **Priority**: P1
* **Type**: Functional / Search

#### `HR-003`
* **Module**: HR Management
* **Role**: HR
* **Scenario**: Add Employee form enforces mandatory validations
* **Precondition**: Logged in as HR
* **Steps**:
  1. Navigate to `/hr/employees/add`.
  2. Submit form without filling required fields.
* **Expected Result**: Form validation blocks submission.
* **Automation File**: `tests/hr/hr-workflow.spec.ts`
* **Priority**: P1
* **Type**: Validation

#### `HR-004`
* **Module**: HR Management
* **Role**: HR
* **Scenario**: Overall PMS Cycle Report view and export triggers
* **Precondition**: Logged in as HR
* **Steps**:
  1. Navigate to `/hr/reports`.
  2. Select "Overall PMS Cycle Report" tab.
* **Expected Result**: Performance report table renders alongside Excel and PDF download buttons.
* **Automation File**: `tests/hr/hr-workflow.spec.ts`
* **Priority**: P0
* **Type**: Functional / Export

#### `HR-005`
* **Module**: HR Management
* **Role**: HR
* **Scenario**: HR rating gate enforces Manager review completion
* **Precondition**: Logged in as HR; employee PMS assignment where Manager review is pending
* **Steps**:
  1. Navigate to `/hr/pms-lifecycle`.
* **Expected Result**: System displays warning banner that Manager review is pending; HR inputs are disabled.
* **Automation File**: `tests/hr/hr-workflow.spec.ts`
* **Priority**: P0
* **Type**: Business Logic Gate

---

### Manager Module

#### `MGR-001`
* **Module**: Manager
* **Role**: Manager
* **Scenario**: Manager Dashboard displays team members and pending reviews
* **Precondition**: Logged in as Manager
* **Steps**:
  1. Navigate to `/manager/dashboard`.
* **Expected Result**: Team members list and pending review counts are rendered.
* **Automation File**: `tests/manager/manager-workflow.spec.ts`
* **Priority**: P1
* **Type**: Functional / UI

#### `MGR-002`
* **Module**: Manager
* **Role**: Manager
* **Scenario**: Strictly enforce 1.0 to 5.0 rating scale (0 rejected)
* **Precondition**: Logged in as Manager; reviewing an assigned employee
* **Steps**:
  1. Open employee review form.
  2. Attempt to input rating `0`.
* **Expected Result**: Validation error is triggered and 0 cannot be submitted.
* **Automation File**: `tests/manager/manager-workflow.spec.ts`
* **Priority**: P0
* **Type**: Validation / Boundary

#### `MGR-003`
* **Module**: Manager
* **Role**: Manager
* **Scenario**: Manager blocked from accessing HR dashboard
* **Precondition**: Logged in as Manager
* **Steps**:
  1. Navigate to `/hr/dashboard`.
* **Expected Result**: Redirected to `/unauthorized` or `/manager/dashboard`.
* **Automation File**: `tests/manager/manager-workflow.spec.ts`
* **Priority**: P0
* **Type**: Security / RBAC

---

### Employee Module

#### `EMP-001`
* **Module**: Employee
* **Role**: Employee
* **Scenario**: Employee Dashboard renders personal PMS summary
* **Precondition**: Logged in as Employee
* **Steps**:
  1. Navigate to `/dashboard`.
* **Expected Result**: Employee dashboard loads with personal KPI overview.
* **Automation File**: `tests/employee/employee-workflow.spec.ts`
* **Priority**: P1
* **Type**: Functional / UI

#### `EMP-002`
* **Module**: Employee
* **Role**: Employee
* **Scenario**: My KPIs self-assessment form renders with 1.0 - 5.0 scale
* **Precondition**: Logged in as Employee
* **Steps**:
  1. Navigate to `/kpis`.
* **Expected Result**: KPI assessment cards display with self-rating inputs.
* **Automation File**: `tests/employee/employee-workflow.spec.ts`
* **Priority**: P0
* **Type**: Functional / Scale

#### `EMP-003`
* **Module**: Employee
* **Role**: Employee
* **Scenario**: View appraisal history
* **Precondition**: Logged in as Employee
* **Steps**:
  1. Navigate to `/history`.
* **Expected Result**: Appraisal history table displays past cycle records.
* **Automation File**: `tests/employee/employee-workflow.spec.ts`
* **Priority**: P2
* **Type**: Functional

#### `EMP-004`
* **Module**: Employee
* **Role**: Employee
* **Scenario**: Profile and password change modal
* **Precondition**: Logged in as Employee
* **Steps**:
  1. Navigate to `/profile`.
* **Expected Result**: Profile info is displayed with Change Password action.
* **Automation File**: `tests/employee/employee-workflow.spec.ts`
* **Priority**: P2
* **Type**: Functional

---

### Security, API & Database Modules

#### `SEC-001` to `SEC-005`
* **Scenarios**: Cross-role access denial, direct unauthenticated API request protection (401/403).
* **Automation File**: `tests/security/rbac.spec.ts`

#### `API-001` to `API-005`
* **Scenarios**: REST API authentication, token verification, HR dashboard and employee endpoints, cycle report retrieval.
* **Automation File**: `tests/api/api-endpoints.spec.ts`

#### `DB-001` to `DB-002`
* **Scenarios**: Direct PostgreSQL verification of employee accounts, role assignments, and KPI weightage integrity.
* **Automation File**: `tests/database/db-verification.spec.ts`

#### `RESP-001`
* **Scenario**: Viewport adaptability across Desktop, Laptop, Tablet, and Mobile devices.
* **Automation File**: `tests/responsive/responsive.spec.ts`

#### `A11Y-001`
* **Scenario**: Automated WCAG accessibility audit using `@axe-core/playwright`.
* **Automation File**: `tests/accessibility/accessibility.spec.ts`

#### `SMOKE-001` & `SMOKE-002`
* **Scenario**: Fast smoke validation of frontend page load and backend API response.
* **Automation File**: `tests/smoke/smoke.spec.ts`
