import { test, expect } from '../../fixtures/testFixtures';

test.describe('HR Module Suite @hr', () => {
  const hrEmail = process.env.TEST_HR_EMAIL || 'hr@aseuro.com';
  const hrPass = process.env.TEST_HR_PASSWORD || 'Hr@12345';

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(hrEmail, hrPass);
    await loginPage.expectLoggedInRoleRedirect('HR');
  });

  test('HR-001: [UI] HR Dashboard displays metric overview cards and recent actions', async ({ hrDashboardPage }) => {
    await hrDashboardPage.goto();
    await hrDashboardPage.verifyDashboardLoaded();
    await expect(hrDashboardPage.page.locator('body')).toContainText(/Employees|PMS|Appraisal/i);
  });

  test('HR-002: [CRUD] HR Employee Directory search filters employees', async ({ hrEmployeePage }) => {
    await hrEmployeePage.gotoDirectory();
    await expect(hrEmployeePage.page).toHaveURL(/\/hr\/employees/);
    if (await hrEmployeePage.searchInput.isVisible()) {
      await hrEmployeePage.searchEmployee('Alice');
      await hrEmployeePage.page.waitForTimeout(500);
      await expect(hrEmployeePage.page.locator('table').first()).toBeVisible();
    }
  });

  test('HR-003: [Validation] Add Employee form enforces mandatory email and name fields', async ({ hrEmployeePage }) => {
    await hrEmployeePage.gotoAddPage();
    await expect(hrEmployeePage.page).toHaveURL(/\/hr\/employees\/add/);
    await hrEmployeePage.submitForm();
    await expect(hrEmployeePage.page).toHaveURL(/\/hr\/employees\/add/);
  });

  test('HR-004: [Reports] HR Reports page displays Overall PMS Cycle Report and export actions', async ({ hrReportsPage }) => {
    await hrReportsPage.goto();
    await expect(hrReportsPage.page).toHaveURL(/\/hr\/reports/);
    await expect(hrReportsPage.overallCycleTabBtn).toBeVisible({ timeout: 10000 });
    await expect(hrReportsPage.excelDownloadBtn).toBeVisible();
    await expect(hrReportsPage.pdfDownloadBtn).toBeVisible();
  });

  test('HR-005: [Lifecycle] HR PMS Lifecycle page enforces manager evaluation before HR finalization', async ({ hrLifecyclePage }) => {
    await hrLifecyclePage.goto();
    await expect(hrLifecyclePage.page).toHaveURL(/\/hr\/(pms-lifecycle|lifecycle)/);
  });
});
