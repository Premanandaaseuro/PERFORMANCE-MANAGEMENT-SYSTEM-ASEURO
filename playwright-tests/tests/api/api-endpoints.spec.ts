import { test, expect } from '../../fixtures/testFixtures';

test.describe('Backend API Endpoint Suite @api', () => {
  const hrEmail = process.env.TEST_HR_EMAIL || 'm.premananda@aseuro.in';
  const hrPass = process.env.TEST_HR_PASSWORD || 'password123';
  let hrToken = '';

  test.beforeAll(async ({ authApi }) => {
    const res = await authApi.login(hrEmail, hrPass);
    if (res.status === 200 && res.body.token) {
      hrToken = res.body.token;
    }
  });

  test('API-001: [Auth] Login endpoint returns valid JWT token and user info', async ({ authApi }) => {
    const res = await authApi.login(hrEmail, hrPass);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('API-002: [Auth] Invalid password returns 401 Unauthorized', async ({ authApi }) => {
    const res = await authApi.login(hrEmail, 'WrongPassword!123');
    expect(res.status).toBe(401);
  });

  test('API-003: [HR] Get HR Dashboard data with valid token returns 200', async ({ hrApi }) => {
    if (!hrToken) test.skip();
    const res = await hrApi.getDashboard(hrToken);
    expect([200, 204]).toContain(res.status());
  });

  test('API-004: [HR] Get Employees list returns array of employees', async ({ hrApi }) => {
    if (!hrToken) test.skip();
    const res = await hrApi.getEmployees(hrToken);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('API-005: [HR] Get Overall Cycle Report returns cycle metrics and employee list', async ({ hrApi }) => {
    if (!hrToken) test.skip();
    const res = await hrApi.getCycleOverallReport(hrToken, 'ALL');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('employees');
  });
});
