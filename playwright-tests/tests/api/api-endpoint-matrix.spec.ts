import { test, expect } from '@playwright/test';

test.describe('Comprehensive REST API Endpoint & Security Matrix', () => {

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:8081';
  let hrToken = '';

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${baseUrl}/api/auth/login`, {
      data: { email: process.env.HR_EMAIL || 'hr@aseuro.com', password: process.env.HR_PASSWORD || 'Hr@12345' }
    });
    if (res.ok()) {
      const data = await res.json();
      hrToken = data.token;
    }
  });

  const getEndpoints = [
    { name: 'HR Dashboard', path: '/api/hr/dashboard' },
    { name: 'HR Employees', path: '/api/hr/employees' },
    { name: 'HR Managers', path: '/api/hr/managers' },
    { name: 'HR Designations', path: '/api/hr/designations' },
    { name: 'HR Cycles', path: '/api/hr/cycles' },
    { name: 'HR Reports Summary', path: '/api/hr/reports/summary' },
    { name: 'Manager Dashboard', path: '/api/manager/dashboard' },
    { name: 'Manager Employees', path: '/api/manager/employees' },
    { name: 'Manager Reports', path: '/api/manager/reports' },
    { name: 'Employee Dashboard', path: '/employee/pms/dashboard' },
    { name: 'Employee History', path: '/employee/pms/history' },
    { name: 'Employee Current Assignment', path: '/employee/pms/current' }
  ];

  // 1. Unauthenticated / Missing Token Rejection (12 cases)
  getEndpoints.forEach((ep, idx) => {
    test(`API-MATRIX-UNAUTH-${String(idx + 1).padStart(2, '0')}: Reject unauthenticated request to ${ep.name}`, async ({ request }) => {
      const res = await request.get(`${baseUrl}${ep.path}`);
      expect([401, 403]).toContain(res.status());
    });
  });

  // 2. Malformed Token Rejection (12 cases)
  getEndpoints.forEach((ep, idx) => {
    test(`API-MATRIX-BADTOKEN-${String(idx + 1).padStart(2, '0')}: Reject malformed Bearer token on ${ep.name}`, async ({ request }) => {
      const res = await request.get(`${baseUrl}${ep.path}`, {
        headers: { Authorization: 'Bearer INVALID_SIGNATURE_DATA' }
      });
      expect([401, 403]).toContain(res.status());
    });
  });

  // 3. HTTP Method Safety (12 cases) - Invalid DELETE/PATCH on GET-only routes
  getEndpoints.forEach((ep, idx) => {
    test(`API-MATRIX-METHOD-${String(idx + 1).padStart(2, '0')}: Invalid HTTP method on ${ep.name}`, async ({ request }) => {
      const res = await request.delete(`${baseUrl}${ep.path}`, {
        headers: { Authorization: `Bearer ${hrToken}` }
      });
      // Spring Security / Spring MVC will reject invalid methods with 403 or 405
      expect([403, 405]).toContain(res.status());
    });
  });

  // 4. Parameter Boundary & SQL Injection Query String Resistance (12 cases)
  getEndpoints.forEach((ep, idx) => {
    test(`API-MATRIX-PARAM-${String(idx + 1).padStart(2, '0')}: Boundary query params safely handled on ${ep.name}`, async ({ request }) => {
      const res = await request.get(`${baseUrl}${ep.path}?id=-1&page=-999&limit=9999999999&search=' OR 1=1 --`, {
        headers: { Authorization: `Bearer ${hrToken}` }
      });
      // Should handle safely without internal unhandled server crash (500)
      expect([200, 400, 403, 404]).toContain(res.status());
    });
  });

  // 5. Direct Payload Mutation Validation (12 cases)
  const mutationPayloads = [
    { name: 'Empty JSON object', body: {} },
    { name: 'Null fields', body: { email: null, password: null } },
    { name: 'Numeric types in string fields', body: { email: 12345, password: 99999 } },
    { name: 'Array in object fields', body: { email: ['hr@aseuro.com'], password: ['pass'] } },
    { name: 'Huge string buffer', body: { email: 'a'.repeat(5000), password: 'b'.repeat(5000) } },
    { name: 'Special unicode characters', body: { email: 'ñõñ-ascii@aseuro.com', password: '🔑' } },
    { name: 'Boolean in string field', body: { email: true, password: false } },
    { name: 'Nested object in credentials', body: { email: { nested: 'val' }, password: '123' } },
    { name: 'HTML script tags in JSON', body: { email: '<script>alert(1)</script>', password: '123' } },
    { name: 'SQL injection string in JSON', body: { email: "admin' --", password: "123" } },
    { name: 'Empty string email & password', body: { email: '', password: '' } },
    { name: 'Whitespace email & password', body: { email: '   ', password: '   ' } }
  ];

  mutationPayloads.forEach((payload, idx) => {
    test(`API-MATRIX-PAYLOAD-${String(idx + 1).padStart(2, '0')}: Mutation body safely rejected (${payload.name})`, async ({ request }) => {
      const res = await request.post(`${baseUrl}/api/auth/login`, {
        data: payload.body
      });
      expect([400, 401, 403]).toContain(res.status());
    });
  });

});
