const http = require('http');

const BASE_URL = 'http://localhost:8080';

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = data ? JSON.stringify(data) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('ASEURO PMS MANAGER MODULE COMPREHENSIVE AUTOMATED VERIFICATION');
  console.log('='.repeat(70));

  // 1. Invalid Manager Login (wrong email)
  console.log('\n[TEST 1] Testing Invalid Manager Login (wrong email)...');
  let res = await makeRequest('/auth/login', 'POST', {
    email: 'wrong.manager@aseuro.com',
    password: 'password',
    role: 'MANAGER',
  });
  if (res.status !== 401 || res.body.message !== 'Invalid email ID.') {
    throw new Error(`Test 1 Failed: Expected 401 with 'Invalid email ID.', got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  console.log(`✓ PASSED: Status ${res.status}, Exact Message: '${res.body.message}'`);

  // 2. Non-Manager attempting Manager Login
  console.log('\n[TEST 2] Testing Non-Manager attempting Manager Login...');
  res = await makeRequest('/auth/login', 'POST', {
    email: 'employee@aseuro.com',
    password: 'password',
    role: 'MANAGER',
  });
  if (res.status !== 401 || res.body.message !== 'Invalid email ID.') {
    throw new Error(`Test 2 Failed: Expected 401 with 'Invalid email ID.', got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  console.log(`✓ PASSED: Status ${res.status}, Blocked non-manager with message: '${res.body.message}'`);

  // 3. Valid Manager Login
  console.log('\n[TEST 3] Testing Valid Manager Login (manager@aseuro.com / password)...');
  res = await makeRequest('/auth/login', 'POST', {
    email: 'manager@aseuro.com',
    password: 'password',
    role: 'MANAGER',
  });
  if (res.status !== 200 || !res.body.token || res.body.role !== 'ROLE_MANAGER') {
    throw new Error(`Test 3 Failed: Valid manager login failed: ${res.status}: ${JSON.stringify(res.body)}`);
  }
  const mgrToken = res.body.token;
  const mgrId = res.body.id;
  console.log(`✓ PASSED: Logged in as '${res.body.name}' (ID: ${mgrId}) with Role '${res.body.role}'`);

  // 4. Manager Dashboard Stats & Dynamic Workflow Heading
  console.log('\n[TEST 4] Testing GET /api/manager/dashboard...');
  res = await makeRequest('/api/manager/dashboard', 'GET', null, mgrToken);
  if (res.status !== 200) {
    throw new Error(`Test 4 Failed: GET /api/manager/dashboard failed: ${res.status}`);
  }
  console.log(`✓ PASSED: Manager: ${res.body.managerName}, Cycle: ${res.body.currentCycle}`);
  console.log(`  Assigned Employees: ${res.body.employeesAssigned}, Pending Reviews: ${res.body.pendingEmployeeReviews}`);
  console.log(`  Dynamic Heading: '${res.body.workflowHeading}', Status: '${res.body.workflowStatus}', Step: ${res.body.activeStep}`);
  console.log(`  Latest Finalized Score (before current finalization): ${res.body.latestFinalizedScore} (${res.body.latestFinalizedGrade})`);

  // 5. Manager Assigned Employees List
  console.log('\n[TEST 5] Testing GET /api/manager/employees...');
  res = await makeRequest('/api/manager/employees', 'GET', null, mgrToken);
  if (res.status !== 200 || !Array.isArray(res.body)) {
    throw new Error(`Test 5 Failed: GET /api/manager/employees failed: ${res.status}`);
  }
  const assignedList = res.body;
  console.log(`✓ PASSED: Found ${assignedList.length} assigned employees reporting to ${res.body[0]?.managerName || 'Alice Smith'}:`);
  assignedList.forEach((e) => {
    console.log(`  • ${e.name} (${e.employeeCode}) - Designation: ${e.designation}, Status: ${e.status}, Can Review: ${e.canReview}`);
  });

  // 6. HR creates a second manager and employee to test strict isolation
  console.log('\n[TEST 6] Testing HR Login & Creating Manager B and Employee B for isolation test...');
  let hrRes = await makeRequest('/auth/login', 'POST', {
    email: 'hr@aseuro.com',
    password: 'Hr@12345',
    role: 'HR',
  });
  const hrToken = hrRes.body.token;

  const mgrBEmail = `mgr.b.${Date.now()}@aseuro.com`;
  const mgrB = await makeRequest(
    '/api/hr/managers',
    'POST',
    {
      name: 'Manager Bravo',
      managerCode: 'MGR-B',
      email: mgrBEmail,
      password: 'Password@123',
      designation: 'Engineering Manager',
      department: 'Engineering',
    },
    hrToken
  );
  const mgrBId = mgrB.body.id;

  const empBEmail = `emp.b.${Date.now()}@aseuro.com`;
  const empB = await makeRequest(
    '/api/hr/employees',
    'POST',
    {
      name: 'Employee Bravo',
      employeeCode: 'EMP-B',
      email: empBEmail,
      password: 'Password@123',
      designation: 'Software Engineer',
      department: 'Engineering',
      managerId: mgrBId,
      role: 'EMPLOYEE',
    },
    hrToken
  );
  const empBId = empB.body.id;
  console.log(`✓ PASSED: Created Manager B (${mgrBId}) and Employee B (${empBId})`);

  // 7. Test Security Isolation: Manager A attempting to access Employee B (reporting to Manager B)
  console.log('\n[TEST 7] Testing Manager A attempting to access Employee B (reporting to Manager B)...');
  res = await makeRequest(`/api/manager/employees/${empBId}/pms`, 'GET', null, mgrToken);
  if (res.status !== 403) {
    throw new Error(`Test 7 Failed: Expected 403 Forbidden for cross-manager access, got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  console.log(`✓ PASSED: Cross-manager access blocked with 403 Forbidden: '${res.body.message}'`);

  // 8. Create Employee A assigned to Manager A and run full PMS review cycle
  console.log('\n[TEST 8] Creating Employee A assigned to Manager A and submitting Self-Assessment...');
  const empAEmail = `emp.a.${Date.now()}@aseuro.com`;
  const empA = await makeRequest(
    '/api/hr/employees',
    'POST',
    {
      name: 'Alex Johnson',
      employeeCode: 'EMP-A',
      email: empAEmail,
      password: 'Password@123',
      designation: 'Software Engineer',
      department: 'Engineering',
      managerId: mgrId,
      role: 'EMPLOYEE',
    },
    hrToken
  );
  const empAId = empA.body.id;

  // Employee A logs in and submits self-assessment
  let empARes = await makeRequest('/auth/login', 'POST', {
    email: empAEmail,
    password: 'Password@123',
    role: 'EMPLOYEE',
  });
  const empAToken = empARes.body.token;

  let currentA = await makeRequest('/employee/pms/current', 'GET', null, empAToken);
  const assignAId = currentA.body.assignmentId;
  const kpisA = currentA.body.kpis;

  const selfPayload = {
    ratings: kpisA.map((k) => ({
      kpiId: k.kpiId,
      selfRating: 4.2,
      comments: 'Completed all target deliverables ahead of schedule.',
    })),
  };
  await makeRequest(`/employee/pms/${assignAId}/submit`, 'POST', selfPayload, empAToken);
  console.log(`✓ PASSED: Employee A (${empAEmail}) submitted Self-Assessment for assignment ${assignAId}`);

  // 9. Manager A reviews Employee A
  console.log('\n[TEST 9] Testing Manager A viewing Employee A Self Ratings & Submitting Manager Review...');
  let reviewData = await makeRequest(`/api/manager/employees/${empAId}/pms`, 'GET', null, mgrToken);
  if (reviewData.status !== 200 || !reviewData.body.canReview) {
    throw new Error(`Test 9 Failed: Manager cannot review employee: ${reviewData.status}: ${JSON.stringify(reviewData.body)}`);
  }
  console.log(`  Employee: ${reviewData.body.employee.name}, Status: ${reviewData.body.status}, Self Score: ${reviewData.body.selfCalculatedScore}`);

  const mgrReviewPayload = {
    ratings: reviewData.body.kpis.map((k) => ({
      kpiId: k.kpiId,
      managerRating: 4.5,
      managerComments: 'High technical competence demonstrated consistently.',
    })),
    managerComments: 'Outstanding performance, demonstrated great teamwork and leadership.',
  };

  let submitRes = await makeRequest(`/api/manager/pms/${assignAId}/submit`, 'POST', mgrReviewPayload, mgrToken);
  if (submitRes.status !== 200 || submitRes.body.status !== 'MANAGER_REVIEW_SUBMITTED') {
    throw new Error(`Test 9 Failed: Submit manager review failed: ${submitRes.status}: ${JSON.stringify(submitRes.body)}`);
  }
  console.log(`✓ PASSED: ${submitRes.body.message} (Status: ${submitRes.body.status})`);

  // 10. Verify HR PMS Lifecycle view reflects Manager Ratings
  console.log('\n[TEST 10] Testing HR PMS Lifecycle view reflects Manager Ratings...');
  let hrLifecycle = await makeRequest(`/api/hr/lifecycle/${empAId}`, 'GET', null, hrToken);
  if (hrLifecycle.status !== 200) {
    throw new Error(`Test 10 Failed: HR lifecycle fetch failed: ${hrLifecycle.status}`);
  }
  console.log(`  HR View Status: ${hrLifecycle.body.status}`);
  const reviewedKpis = hrLifecycle.body.kpis;
  reviewedKpis.forEach((k) => {
    console.log(`  • ${k.kpiName}: Self=${k.selfRating}, Manager=${k.managerRating}, Weight=${k.weightage}%`);
    if (k.managerRating !== 4.5) {
      throw new Error(`Expected Manager Rating 4.5, got ${k.managerRating}`);
    }
  });
  console.log('✓ PASSED: HR PMS Lifecycle accurately displays Manager Ratings from PostgreSQL!');

  // 11. HR Finalizes PMS
  console.log('\n[TEST 11] Testing HR Finalizes PMS...');
  let finRes = await makeRequest(
    `/api/hr/lifecycle/${assignAId}/finalize`,
    'POST',
    {
      overallScore: 4.45,
      performanceGrade: 'Excellent Performance',
      hrComments: 'Manager and self ratings calibrated. Approved.',
    },
    hrToken
  );
  if (finRes.status !== 200) {
    throw new Error(`Test 11 Failed: HR Finalization failed: ${finRes.status}`);
  }
  console.log(`✓ PASSED: HR Finalized with Score ${finRes.body.finalScore} (${finRes.body.grade})`);

  // 12. Verify Finalized Score & Status reflected in Manager Dashboard & Reports
  console.log('\n[TEST 12] Testing Finalized Score & Status reflected in Manager Dashboard...');
  let mgrDash = await makeRequest('/api/manager/dashboard', 'GET', null, mgrToken);
  console.log(`  Manager Dashboard Completed Reviews: ${mgrDash.body.completedEmployeeReviews}`);

  let mgrReports = await makeRequest('/api/manager/reports', 'GET', null, mgrToken);
  const foundEmpInReports = mgrReports.body.assignedEmployees.find((e) => e.id === empAId);
  if (!foundEmpInReports || foundEmpInReports.overallScore !== 4.45) {
    throw new Error(`Test 12 Failed: Expected final score 4.45 in Manager Reports, got: ${JSON.stringify(foundEmpInReports)}`);
  }
  console.log(`✓ PASSED: Final score 4.45 and grade '${foundEmpInReports.performanceGrade}' reflected in Manager Reports!`);

  // 13. Verify Finalized PMS is Locked against further Manager modification
  console.log('\n[TEST 13] Testing Finalized PMS is Locked against further Manager editing...');
  let blockedRes = await makeRequest(`/api/manager/pms/${assignAId}/submit`, 'POST', mgrReviewPayload, mgrToken);
  if (blockedRes.status !== 400 || !blockedRes.body.message.includes('already been finalized by HR')) {
    throw new Error(`Test 13 Failed: Expected 400 rejection for finalized PMS modification, got ${blockedRes.status}: ${JSON.stringify(blockedRes.body)}`);
  }
  console.log(`✓ PASSED: Manager modification blocked: '${blockedRes.body.message}'`);

  // 14. Verify Employee views finalized score & locked state
  console.log('\n[TEST 14] Testing Employee views finalized score & locked state in My KPIs...');
  let empCurrent = await makeRequest('/employee/pms/current', 'GET', null, empAToken);
  if (empCurrent.body.overallScore !== 4.45 || empCurrent.body.status !== 'COMPLETED') {
    throw new Error(`Test 14 Failed: Employee view did not reflect finalized status: ${JSON.stringify(empCurrent.body)}`);
  }
  console.log(`✓ PASSED: Employee views finalized score ${empCurrent.body.overallScore} and grade '${empCurrent.body.performanceGrade}'!`);

  console.log('\n' + '='.repeat(70));
  console.log('ALL MANAGER MODULE TESTS PASSED WITH 100% SUCCESS!');
  console.log('='.repeat(70));
}

runTests().catch((err) => {
  console.error('\n❌ Verification Error:', err);
  process.exit(1);
});
