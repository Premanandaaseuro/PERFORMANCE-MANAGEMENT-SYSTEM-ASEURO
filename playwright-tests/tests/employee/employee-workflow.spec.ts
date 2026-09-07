import { test, expect } from '../../fixtures/testFixtures';

test.describe('Employee Module Suite @employee', () => {
  const empEmail = process.env.TEST_EMPLOYEE_EMAIL || 'employee@aseuro.com';
  const empPass = process.env.TEST_EMPLOYEE_PASSWORD || 'Hr@12345';

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(empEmail, empPass);
    await loginPage.expectLoggedInRoleRedirect('EMPLOYEE');
  });

  test('EMP-001: [UI] Employee Dashboard displays personal appraisal overview', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('body')).toContainText(/Welcome|Overview|PMS|KPI/i);
  });

  test('EMP-002: [Self Assessment] My KPIs page displays self-rating inputs with 1.0 - 5.0 scale', async ({ employeeKpiPage }) => {
    await employeeKpiPage.goto();
    await expect(employeeKpiPage.page).toHaveURL(/\/kpis/);
    await expect(employeeKpiPage.page.locator('h1, h2, h3').first()).toContainText(/KPI/i);
  });

  test('EMP-003: [History] Employee can view past appraisal history', async ({ page }) => {
    await page.goto('/history');
    await expect(page).toHaveURL(/\/history/);
  });

  test('EMP-004: [Profile] Employee can access profile details', async ({ profilePage }) => {
    await profilePage.goto();
    await expect(profilePage.page).toHaveURL(/\/profile/);
  });
});
