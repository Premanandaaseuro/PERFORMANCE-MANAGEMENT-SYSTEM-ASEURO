import { test, expect } from '@playwright/test';

test.describe('API Latency & Performance Benchmark Matrix', () => {

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

  const benchmarkEndpoints = [
    { name: 'HR Dashboard Stats', path: '/api/hr/dashboard' },
    { name: 'HR Employee Directory', path: '/api/hr/employees' },
    { name: 'HR Managers List', path: '/api/hr/managers' },
    { name: 'HR Designations Profiles', path: '/api/hr/designations' },
    { name: 'HR Active Cycles', path: '/api/hr/cycles' },
    { name: 'HR Reports Summary', path: '/api/hr/reports/summary' },
    { name: 'Manager Dashboard Stats', path: '/api/manager/dashboard' },
    { name: 'Manager Team Employees', path: '/api/manager/employees' },
    { name: 'Manager Reports Summary', path: '/api/manager/reports' },
    { name: 'Employee Active Assignment', path: '/employee/pms/current' },
    { name: 'Employee Historical Cycles', path: '/employee/pms/history' },
    { name: 'Backend Health Check', path: '/api/health' }
  ];

  benchmarkEndpoints.forEach((ep, idx) => {
    test(`PERF-LATENCY-${String(idx + 1).padStart(2, '0')}: ${ep.name} responds within 1000ms threshold`, async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${baseUrl}${ep.path}`, {
        headers: { Authorization: `Bearer ${hrToken}` }
      });
      const duration = Date.now() - start;

      expect([200, 401, 403]).toContain(res.status());
      expect(duration).toBeLessThan(1000); // Latency benchmark threshold
    });
  });

  // Concurrency Burst Test (3 parallel calls)
  test('PERF-BURST-01: Rapid 3-request concurrent burst handled cleanly', async ({ request }) => {
    const promises = [
      request.get(`${baseUrl}/api/hr/dashboard`, { headers: { Authorization: `Bearer ${hrToken}` } }),
      request.get(`${baseUrl}/api/hr/employees`, { headers: { Authorization: `Bearer ${hrToken}` } }),
      request.get(`${baseUrl}/api/hr/managers`, { headers: { Authorization: `Bearer ${hrToken}` } })
    ];
    const results = await Promise.all(promises);
    for (const res of results) {
      expect(res.status()).toBe(200);
    }
  });

});
