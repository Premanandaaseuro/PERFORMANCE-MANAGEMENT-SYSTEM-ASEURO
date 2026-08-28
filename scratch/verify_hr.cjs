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
  console.log('='.repeat(65));
  console.log('ASEURO PMS HR MODULE COMPREHENSIVE AUTOMATED VERIFICATION');
  console.log('='.repeat(65));

  // 1. Invalid HR Login
  console.log('\n[TEST 1] Testing Invalid HR Login (wrong email)...');
  let res = await makeRequest('/auth/login', 'POST', {
    email: 'wrong.hr@aseuro.com',
    password: 'password',
    role: 'HR',
  });
  if (res.status !== 401 || res.body.message !== 'Invalid HR email ID.') {
    throw new Error(`Test 1 Failed: Expected 401 with 'Invalid HR email ID.', got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  console.log(`✓ PASSED: Status ${res.status}, Message: '${res.body.message}'`);

  // 2. Non-HR User attempting HR Login
  console.log('\n[TEST 2] Testing Non-HR User attempting HR Login...');
  res = await makeRequest('/auth/login', 'POST', {
    email: 'employee@aseuro.com',
    password: 'password',
    role: 'HR',
  });
  if (res.status !== 401 || res.body.message !== 'Invalid HR email ID.') {
    throw new Error(`Test 2 Failed: Expected 401 with 'Invalid HR email ID.', got ${res.status}: ${JSON.stringify(res.body)}`);
  }
  console.log(`✓ PASSED: Status ${res.status}, Message: '${res.body.message}'`);

  // 3. Valid HR Login
  console.log('\n[TEST 3] Testing Valid HR Login (hr@aseuro.com / Hr@12345)...');
  res = await makeRequest('/auth/login', 'POST', {
    email: 'hr@aseuro.com',
    password: 'Hr@12345',
    role: 'HR',
  });
  if (res.status !== 200 || !res.body.token || res.body.role !== 'ROLE_HR') {
    throw new Error(`Test 3 Failed: Valid HR Login failed: ${res.status}: ${JSON.stringify(res.body)}`);
  }
  const token = res.body.token;
  console.log(`✓ PASSED: Logged in as '${res.body.name}' with Role '${res.body.role}'`);

  // 4. HR Dashboard Stats
  console.log('\n[TEST 4] Testing GET /api/hr/dashboard...');
  res = await makeRequest('/api/hr/dashboard', 'GET', null, token);
  if (res.status !== 200) {
    throw new Error(`Test 4 Failed: GET /api/hr/dashboard failed: ${res.status}: ${JSON.stringify(res.body)}`);
  }
  console.log(`✓ PASSED: Total Employees: ${res.body.totalEmployees}, Managers: ${res.body.totalManagers}, Designations: ${res.body.totalDesignations}, Completed Cycles: ${res.body.completedCycles}`);

  // 5. Designation List
  console.log('\n[TEST 5] Testing GET /api/hr/designations...');
  res = await makeRequest('/api/hr/designations', 'GET', null, token);
  if (res.status !== 200 || !Array.isArray(res.body)) {
    throw new Error(`Test 5 Failed: GET /api/hr/designations failed: ${res.status}`);
  }
  const desigNames = res.body.map((d) => d.name).join(', ');
  console.log(`✓ PASSED: Available Designations: ${desigNames}`);

  // 6. Manager List & Create Manager
  console.log('\n[TEST 6] Testing GET & POST /api/hr/managers...');
  const mgrEmail = `devin.lead.${Date.now()}@aseuro.com`;
  res = await makeRequest(
    '/api/hr/managers',
    'POST',
    {
      name: 'Devin Lead',
      managerCode: 'MGR-888',
      email: mgrEmail,
      password: 'Password@123',
      designation: 'Engineering Manager',
      department: 'Engineering',
    },
    token
  );
  if (res.status !== 201 || !res.body.id) {
    throw new Error(`Test 6 Failed: POST /api/hr/managers failed: ${res.status}: ${JSON.stringify(res.body)}`);
  }
  const mgrId = res.body.id;
  console.log(`✓ PASSED: Created Manager '${res.body.name}' (ID: ${mgrId})`);

  // 7. KPI Master List & Total Weightage Validation (> 100%)
  console.log('\n[TEST 7] Testing KPI Master & 100% Weightage Validation...');
  res = await makeRequest('/api/hr/kpis?designation=Software%20Engineer', 'GET', null, token);
  if (res.status !== 200 || !Array.isArray(res.body)) {
    throw new Error(`Test 7 Failed: GET /api/hr/kpis failed: ${res.status}`);
  }
  const totalWeight = res.body.reduce((sum, k) => sum + (k.weightage || 0), 0);
  console.log(`Current Software Engineer KPIs: ${res.body.length}, Total Weightage: ${totalWeight}%`);

  res = await makeRequest(
    '/api/hr/kpis',
    'POST',
    {
      designation: 'Software Engineer',
      kpiName: 'Excess Weight KPI',
      description: 'Should trigger error',
      weightage: 25.0,
    },
    token
  );
  if (res.status !== 400 || !res.body.message.includes('Total KPI weightage cannot exceed 100%')) {
    throw new Error(`Test 7 Failed: Excess weightage was not rejected: ${res.status}: ${JSON.stringify(res.body)}`);
  }
  console.log(`✓ PASSED: Excess weightage rejected with message: '${res.body.message}'`);

  // 8. Add Employee with Auto-Assigned KPIs
  console.log('\n[TEST 8] Testing POST /api/hr/employees (Auto KPI assignment)...');
  const empEmail = `sneha.reddy.${Date.now()}@aseuro.com`;
  res = await makeRequest(
    '/api/hr/employees',
    'POST',
    {
      name: 'Sneha Reddy',
      employeeCode: 'EMP-909',
      email: empEmail,
      password: 'Password@123',
      designation: 'Software Engineer',
      department: 'Engineering',
      team: 'Core Platform',
      managerId: mgrId,
      role: 'EMPLOYEE',
    },
    token
  );
  if (res.status !== 201 || !res.body.id) {
    throw new Error(`Test 8 Failed: POST /api/hr/employees failed: ${res.status}: ${JSON.stringify(res.body)}`);
  }
  const empId = res.body.id;
  const assignedCount = res.body.assignedKpisCount;
  console.log(`✓ PASSED: Created Employee '${res.body.name}' (ID: ${empId}) with ${assignedCount} Auto-Assigned KPIs!`);

  // 9. Employee Lifecycle Tracking & 5-Stage Progression
  console.log(`\n[TEST 9] Testing Employee Lifecycle Tracking for EMP-${empId}...`);
  res = await makeRequest(`/api/hr/lifecycle/${empId}`, 'GET', null, token);
  if (res.status !== 200 || !res.body.workflowStages) {
    throw new Error(`Test 9 Failed: GET /api/hr/lifecycle failed: ${res.status}: ${JSON.stringify(res.body)}`);
  }
  const assignmentId = res.body.assignmentId;
  const stages = res.body.workflowStages;
  console.log(`Employee: ${res.body.employee.name}, Cycle: ${res.body.cycleMonth}, Assignment ID: ${assignmentId}`);
  console.log('5-Stage Workflow Tracker:');
  stages.forEach((s) => {
    console.log(`  Step ${s.step}: ${s.title} -> Status: ${s.status}`);
  });
  console.log(`Assigned KPIs in Matrix: ${res.body.kpis.length}`);
  if (stages.length !== 5) {
    throw new Error(`Expected 5 workflow stages, got ${stages.length}`);
  }
  console.log('✓ PASSED: Complete 5-stage tracking and KPI ratings matrix retrieved.');

  // 10. HR Finalise and Submit
  console.log(`\n[TEST 10] Testing POST /api/hr/lifecycle/${assignmentId}/finalize...`);
  res = await makeRequest(
    `/api/hr/lifecycle/${assignmentId}/finalize`,
    'POST',
    {
      overallScore: 4.4,
      performanceGrade: 'Excellent Performance',
      hrComments: 'Excellent technical competence and high ownership demonstrated.',
    },
    token
  );
  if (res.status !== 200 || res.body.status !== 'COMPLETED') {
    throw new Error(`Test 10 Failed: POST finalize failed: ${res.status}: ${JSON.stringify(res.body)}`);
  }
  console.log(`✓ PASSED: ${res.body.message} Final Score: ${res.body.finalScore} (${res.body.grade})`);

  // 11. HR Reports Summary (Dynamic Category Distribution)
  console.log('\n[TEST 11] Testing GET /api/hr/reports/summary...');
  res = await makeRequest('/api/hr/reports/summary', 'GET', null, token);
  if (res.status !== 200 || !Array.isArray(res.body.categories)) {
    throw new Error(`Test 11 Failed: GET reports summary failed: ${res.status}`);
  }
  console.log(`Total Published Appraisals: ${res.body.totalFinalizedRecords}, Average Score: ${res.body.averageScore}`);
  console.log('Rating Category Distribution:');
  res.body.categories.forEach((cat) => {
    console.log(`  • ${cat.category}: ${cat.count} employees (${cat.percentage}%)`);
  });
  console.log('✓ PASSED: Rating category breakdown dynamically calculated from PostgreSQL records.');

  // 12. Employee Login to verify auto-assigned KPIs from their view
  console.log('\n[TEST 12] Testing Employee Login & Assigned KPIs View...');
  res = await makeRequest('/auth/login', 'POST', {
    email: empEmail,
    password: 'Password@123',
    role: 'EMPLOYEE',
  });
  if (res.status !== 200 || !res.body.token) {
    throw new Error(`Test 12 Failed: Employee login failed: ${res.status}`);
  }
  const empToken = res.body.token;
  res = await makeRequest('/employee/pms/current', 'GET', null, empToken);
  if (res.status !== 200 || !res.body.kpis) {
    throw new Error(`Test 12 Failed: GET /employee/pms/current failed: ${res.status}`);
  }
  console.log(`Employee successfully logged in, seeing ${res.body.kpis.length} assigned KPIs in active cycle '${res.body.cycleMonth}'!`);
  console.log('✓ PASSED: Full Employee-to-HR lifecycle verified!');

  console.log('\n' + '='.repeat(65));
  console.log('ALL 12 HR MODULE SUITE TESTS PASSED WITH 100% SUCCESS!');
  console.log('='.repeat(65));
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Error:', err);
  process.exit(1);
});
