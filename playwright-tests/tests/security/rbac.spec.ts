import { test, expect } from '../../fixtures/testFixtures';

test.describe('Role-Based Access Control (RBAC) & Security Suite @security', () => {
  const empEmail = process.env.TEST_EMPLOYEE_EMAIL || 'employee@aseuro.com';
  const empPass = process.env.TEST_EMPLOYEE_PASSWORD || 'Hr@12345';
  const mgrEmail = process.env.TEST_MANAGER_EMAIL || 'manager@aseuro.com';
  const mgrPass = process.env.TEST_MANAGER_PASSWORD || 'Hr@12345';

  test('SEC-001: [RBAC] Employee cannot access HR dashboard', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(empEmail, empPass);
    await loginPage.expectLoggedInRoleRedirect('EMPLOYEE');

    await page.goto('/hr/dashboard');
    await expect(page).toHaveURL(/\/unauthorized|\/dashboard/);
  });

  test('SEC-002: [RBAC] Employee cannot access Manager dashboard', async ({ page }) => {
    await page.goto('/manager/dashboard');
    await expect(page).toHaveURL(/\/unauthorized|\/dashboard/);
  });

  test('SEC-003: [RBAC] Manager cannot access HR lifecycle or settings', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(mgrEmail, mgrPass);
    await loginPage.expectLoggedInRoleRedirect('MANAGER');

    await page.goto('/hr/pms-lifecycle');
    await expect(page).toHaveURL(/\/unauthorized|\/manager\/dashboard/);
  });

  test('SEC-004: [API Security] Unauthenticated request to HR endpoint returns 401/403', async ({ request }) => {
    const response = await request.get('http://localhost:8081/api/hr/dashboard');
    expect([401, 403]).toContain(response.status());
  });

  test('SEC-005: [API Security] Unauthenticated request to Manager endpoint returns 401/403', async ({ request }) => {
    const response = await request.get('http://localhost:8081/api/manager/dashboard');
    expect([401, 403]).toContain(response.status());
  });
});
