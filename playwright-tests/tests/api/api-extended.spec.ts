import { test, expect } from '@playwright/test';

test.describe('Exhaustive Backend REST API Verification', () => {

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:8081';
  let hrToken = '';
  let managerToken = '';
  let employeeToken = '';

  test.beforeAll(async ({ request }) => {
    // Authenticate HR
    const hrRes = await request.post(`${baseUrl}/api/auth/login`, {
      data: { email: process.env.HR_EMAIL || 'hr@aseuro.com', password: process.env.HR_PASSWORD || 'Hr@12345' }
    });
    if (hrRes.ok()) {
      const data = await hrRes.json();
      hrToken = data.token;
    }

    // Authenticate Manager
    const mgrRes = await request.post(`${baseUrl}/api/auth/login`, {
      data: { email: process.env.MANAGER_EMAIL || 'manager@aseuro.com', password: process.env.MANAGER_PASSWORD || 'Hr@12345' }
    });
    if (mgrRes.ok()) {
      const data = await mgrRes.json();
      managerToken = data.token;
    }

    // Authenticate Employee
    const empRes = await request.post(`${baseUrl}/api/auth/login`, {
      data: { email: process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com', password: process.env.EMPLOYEE_PASSWORD || 'Hr@12345' }
    });
    if (empRes.ok()) {
      const data = await empRes.json();
      employeeToken = data.token;
    }
  });

  test('API-EXT-001: GET /api/hr/dashboard returns 200 and stats payload', async ({ request }) => {
    const res = await request.get(`${baseUrl}/api/hr/dashboard`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeDefined();
    expect(typeof body.totalEmployees).toBe('number');
  });

  test('API-EXT-002: GET /api/hr/managers returns list of company managers', async ({ request }) => {
    const res = await request.get(`${baseUrl}/api/hr/managers`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('API-EXT-003: GET /api/hr/designations returns designation profiles', async ({ request }) => {
    const res = await request.get(`${baseUrl}/api/hr/designations`, {
      headers: { Authorization: `Bearer ${hrToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('API-EXT-004: GET /api/manager/dashboard returns manager review metrics', async ({ request }) => {
    const res = await request.get(`${baseUrl}/api/manager/dashboard`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('API-EXT-005: GET /api/manager/employees returns assigned team employees', async ({ request }) => {
    const res = await request.get(`${baseUrl}/api/manager/employees`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('API-EXT-006: GET /employee/pms/dashboard returns employee assignment details', async ({ request }) => {
    const res = await request.get(`${baseUrl}/employee/pms/dashboard`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('API-EXT-007: GET /employee/pms/history returns employee historical records', async ({ request }) => {
    const res = await request.get(`${baseUrl}/employee/pms/history`, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('API-EXT-008: Protected endpoints reject invalid malformed Bearer tokens with 401', async ({ request }) => {
    const res = await request.get(`${baseUrl}/api/hr/dashboard`, {
      headers: { Authorization: 'Bearer INVALID_MALFORMED_EXPIRED_TOKEN' }
    });
    expect([401, 403]).toContain(res.status());
  });

});
