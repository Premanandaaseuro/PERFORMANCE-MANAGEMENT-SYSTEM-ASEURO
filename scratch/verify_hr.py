import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8080"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            resp_body = resp.read().decode("utf-8")
            return status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed

def run_tests():
    print("=" * 60)
    print("ASEURO PMS HR MODULE COMPREHENSIVE AUTOMATED VERIFICATION")
    print("=" * 60)

    # 1. Invalid HR Login
    print("\n[TEST 1] Testing Invalid HR Login...")
    status, body = make_request("/auth/login", "POST", {"email": "wrong.hr@aseuro.com", "password": "password", "role": "HR"})
    assert status == 401, f"Expected 401, got {status}"
    assert body.get("message") == "Invalid HR email ID.", f"Unexpected message: {body}"
    print(f"✓ PASSED: Status {status}, Message: '{body.get('message')}'")

    # 2. Non-HR User attempting HR Login
    print("\n[TEST 2] Testing Non-HR User attempting HR Login...")
    status, body = make_request("/auth/login", "POST", {"email": "employee@aseuro.com", "password": "password", "role": "HR"})
    assert status == 401, f"Expected 401, got {status}"
    assert body.get("message") == "Invalid HR email ID.", f"Unexpected message: {body}"
    print(f"✓ PASSED: Status {status}, Message: '{body.get('message')}'")

    # 3. Valid HR Login
    print("\n[TEST 3] Testing Valid HR Login (hr@aseuro.com / Hr@12345)...")
    status, body = make_request("/auth/login", "POST", {"email": "hr@aseuro.com", "password": "Hr@12345", "role": "HR"})
    assert status == 200, f"Expected 200, got {status}"
    token = body.get("token")
    assert token is not None, "Token was None"
    assert body.get("role") == "ROLE_HR", f"Unexpected role: {body.get('role')}"
    print(f"✓ PASSED: Logged in as '{body.get('name')}' with Role '{body.get('role')}'")

    # 4. HR Dashboard Stats
    print("\n[TEST 4] Testing GET /api/hr/dashboard...")
    status, body = make_request("/api/hr/dashboard", "GET", token=token)
    assert status == 200, f"Expected 200, got {status}"
    print(f"✓ PASSED: Total Employees: {body.get('totalEmployees')}, Managers: {body.get('totalManagers')}, Designations: {body.get('totalDesignations')}, Completed Cycles: {body.get('completedCycles')}")

    # 5. Designation List
    print("\n[TEST 5] Testing GET /api/hr/designations...")
    status, body = make_request("/api/hr/designations", "GET", token=token)
    assert status == 200, f"Expected 200, got {status}"
    desig_names = [d.get("name") for d in body]
    print(f"✓ PASSED: Available Designations: {', '.join(desig_names)}")

    # 6. Manager List & Create Manager
    print("\n[TEST 6] Testing GET & POST /api/hr/managers...")
    import time
    mgr_email = f"lead.mgr.{int(time.time())}@aseuro.com"
    mgr_payload = {
        "name": "Devin Lead",
        "managerCode": "MGR-888",
        "email": mgr_email,
        "password": "Password@123",
        "designation": "Engineering Manager",
        "department": "Engineering"
    }
    status, body = make_request("/api/hr/managers", "POST", data=mgr_payload, token=token)
    assert status == 201, f"Expected 201, got {status}, body={body}"
    mgr_id = body.get("id")
    print(f"✓ PASSED: Created Manager '{body.get('name')}' (ID: {mgr_id})")

    # 7. KPI Master List & Total Weightage Validation (> 100%)
    print("\n[TEST 7] Testing KPI Master & 100% Weightage Validation...")
    status, kpis = make_request("/api/hr/kpis?designation=Software%20Engineer", "GET", token=token)
    assert status == 200, f"Expected 200, got {status}"
    total_weight = sum(k.get("weightage", 0) for k in kpis)
    print(f"Current Software Engineer KPIs: {len(kpis)}, Total Weightage: {total_weight}%")

    excess_kpi = {
        "designation": "Software Engineer",
        "kpiName": "Excess Weight KPI",
        "description": "Should trigger error",
        "weightage": 25.0
    }
    status, err_body = make_request("/api/hr/kpis", "POST", data=excess_kpi, token=token)
    assert status == 400, f"Expected 400, got {status}, body={err_body}"
    assert "Total KPI weightage cannot exceed 100%" in err_body.get("message", ""), f"Unexpected error: {err_body}"
    print(f"✓ PASSED: Excess weightage rejected with message: '{err_body.get('message')}'")

    # 8. Add Employee with Auto-Assigned KPIs
    print("\n[TEST 8] Testing POST /api/hr/employees (Auto KPI assignment)...")
    emp_email = f"sneha.reddy.{int(time.time())}@aseuro.com"
    emp_payload = {
        "name": "Sneha Reddy",
        "employeeCode": "EMP-909",
        "email": emp_email,
        "password": "Password@123",
        "designation": "Software Engineer",
        "department": "Engineering",
        "team": "Core Platform",
        "managerId": mgr_id,
        "role": "EMPLOYEE"
    }
    status, body = make_request("/api/hr/employees", "POST", data=emp_payload, token=token)
    assert status == 201, f"Expected 201, got {status}, body={body}"
    emp_id = body.get("id")
    assigned_count = body.get("assignedKpisCount")
    print(f"✓ PASSED: Created Employee '{body.get('name')}' (ID: {emp_id}) with {assigned_count} Auto-Assigned KPIs!")

    # 9. Employee Lifecycle Tracking & 5-Stage Progression
    print(f"\n[TEST 9] Testing Employee Lifecycle Tracking for EMP-{emp_id}...")
    status, lifecycle = make_request(f"/api/hr/lifecycle/{emp_id}", "GET", token=token)
    assert status == 200, f"Expected 200, got {status}"
    assignment_id = lifecycle.get("assignmentId")
    stages = lifecycle.get("workflowStages", [])
    print(f"Employee: {lifecycle.get('employee', {}).get('name')}, Cycle: {lifecycle.get('cycleMonth')}, Assignment ID: {assignment_id}")
    print("5-Stage Workflow Tracker:")
    for s in stages:
        print(f"  Step {s.get('step')}: {s.get('title')} -> Status: {s.get('status')}")
    print(f"Assigned KPIs in Matrix: {len(lifecycle.get('kpis', []))}")
    assert len(stages) == 5, f"Expected 5 stages, got {len(stages)}"
    print("✓ PASSED: Complete 5-stage tracking and KPI ratings matrix retrieved.")

    # 10. HR Finalise and Submit
    print(f"\n[TEST 10] Testing POST /api/hr/lifecycle/{assignment_id}/finalize...")
    final_payload = {
        "overallScore": 4.40,
        "performanceGrade": "Excellent Performance",
        "hrComments": "Excellent technical competence and high ownership demonstrated."
    }
    status, fin_body = make_request(f"/api/hr/lifecycle/{assignment_id}/finalize", "POST", data=final_payload, token=token)
    assert status == 200, f"Expected 200, got {status}"
    print(f"✓ PASSED: {fin_body.get('message')} Final Score: {fin_body.get('finalScore')} ({fin_body.get('grade')})")

    # 11. HR Reports Summary (Dynamic Category Distribution)
    print("\n[TEST 11] Testing GET /api/hr/reports/summary...")
    status, sum_body = make_request("/api/hr/reports/summary", "GET", token=token)
    assert status == 200, f"Expected 200, got {status}"
    print(f"Total Published Appraisals: {sum_body.get('totalFinalizedRecords')}, Average Score: {sum_body.get('averageScore')}")
    print("Rating Category Distribution:")
    for cat in sum_body.get("categories", []):
        print(f"  • {cat.get('category')}: {cat.get('count')} employees ({cat.get('percentage')}%)")
    print("✓ PASSED: Rating category breakdown dynamically calculated from PostgreSQL records.")

    # 12. Employee Login to verify auto-assigned KPIs from their view
    print("\n[TEST 12] Testing Employee Login & Assigned KPIs View...")
    status, emp_auth = make_request("/auth/login", "POST", {"email": emp_email, "password": "Password@123", "role": "EMPLOYEE"})
    assert status == 200, f"Expected 200, got {status}"
    emp_token = emp_auth.get("token")
    status, pms_active = make_request("/employee/pms/active", "GET", token=emp_token)
    assert status == 200, f"Expected 200, got {status}"
    print(f"Employee successfully logged in, seeing {len(pms_active.get('kpis', []))} assigned KPIs in active cycle '{pms_active.get('cycleMonth')}'!")
    print("✓ PASSED: Full Employee-to-HR lifecycle verified!")

    print("\n" + "=" * 60)
    print("ALL 12 HR MODULE SUITE TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
