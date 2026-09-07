# Bugs Found & Defect Tracking Log

This document records defects and behavioral anomalies observed during automated inspection and testing of the Performance Management System (PMS). In accordance with the testing principles, application functionality is not silently altered to make tests pass; issues are documented here for tracking and resolution.

---

### Defect Register

| Bug ID | Module | Severity | Summary | Related Test Case | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BUG-001` | Authentication | Low | Trailing space in login email field can cause case or format mismatches on unnormalized email strings | `AUTH-004` | Logged for backend email lowercase trimming |
| `BUG-002` | HR Lifecycle | Medium | In legacy cycles with unmigrated schema, initial HR ratings default to null if not loaded through lifecycle endpoint | `HR-005` | Mitigated in frontend by defaulting to 0 for unrated HR lines |
| `BUG-003` | Employee | Low | Quick scale buttons on small mobile viewports (375px) wrap onto multiple lines | `RESP-001` | UI cosmetic improvement recommended |
| `BUG-004` | Accessibility | Moderate | Login page content lacks wrapping HTML5 `<main>` landmark, causing ARIA `region` landmark violation | `A11Y-001` | Documented in BUGS-FOUND.md |
| `BUG-005` | Accessibility | Moderate | Login page jumps heading hierarchy to `<h4>` directly without an intermediate `<h3>`, and document root lacks `<main>` landmark | `A11Y-001` | Documented in BUGS-FOUND.md |

---

### Detailed Bug Descriptions

#### `BUG-001`: Email Normalization on Sign-In
* **Module**: Authentication
* **Severity**: Low
* **Steps to Reproduce**:
  1. Go to `/login`.
  2. Input `m.premananda@aseuro.in ` (with a trailing space).
  3. Enter valid password and submit.
* **Expected Result**: Email is auto-trimmed prior to authentication attempt.
* **Actual Result**: Email is submitted as-is unless sanitized by frontend handler.

#### `BUG-002`: Unrated HR Lines Null Coalescing
* **Module**: HR Lifecycle
* **Severity**: Medium
* **Steps to Reproduce**:
  1. Open HR Lifecycle view for an employee prior to HR scoring.
* **Expected Result**: HR rating line strictly displays default `0` without throwing NaN or null reference.
* **Actual Result**: Resolved via frontend fallback `(kpi.hrRating ?? 0)`.

#### `BUG-003`: Responsive Rating Button Wrapping on Small Viewports
* **Module**: Employee / Manager KPI Assessment
* **Severity**: Low (Cosmetic)
* **Steps to Reproduce**:
  1. Set viewport to 375px (iPhone SE).
  2. Open `/kpis` or `/manager/employees/:id/review`.
* **Expected Result**: 1 to 5 scale buttons fit inline cleanly.
* **Actual Result**: Button group wraps into 2 rows on ultra-narrow displays.
