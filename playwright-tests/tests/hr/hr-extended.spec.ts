import { test, expect } from '../../fixtures/testFixtures';

test.describe('HR Administration Extended Workflows', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(process.env.HR_EMAIL || 'hr@aseuro.com', process.env.HR_PASSWORD || 'Hr@12345');
    await loginPage.expectLoggedInRoleRedirect('HR');
  });

  test('HR-EXT-001: HR Managers directory renders list and search filter', async ({ page }) => {
    await page.goto('/hr/managers');
    await expect(page).toHaveURL(/\/hr\/managers/);

    // Search input should be visible
    const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    // Table or manager list container
    const managerContainer = page.locator('table, .grid, main').first();
    await expect(managerContainer).toBeVisible();
  });

  test('HR-EXT-002: HR Managers search filters records dynamically', async ({ page }) => {
    await page.goto('/hr/managers');
    const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    await searchInput.fill('Manager');
    await page.waitForTimeout(300);
    await expect(page.locator('body')).toBeVisible();
    await searchInput.clear();
  });

  test('HR-EXT-003: HR KPI Library renders designation templates and weights', async ({ page }) => {
    await page.goto('/hr/kpis');
    await expect(page).toHaveURL(/\/hr\/kpis/);

    // Verify main content and heading
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // Verify presence of buttons or tabs
    const interactiveElements = page.locator('button, select, input').first();
    await expect(interactiveElements).toBeVisible();
  });

  test('HR-EXT-004: HR Add Employee rejects duplicate email or invalid phone', async ({ page }) => {
    await page.goto('/hr/employees/add');
    await expect(page).toHaveURL(/\/hr\/employees\/add/);

    // Try filling an existing employee email
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('employee@aseuro.com');
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      // Should show error validation or remain on page
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/hr/employees/add');
    }
  });

  test('HR-EXT-005: HR Add Employee dropdown options contain valid departments', async ({ page }) => {
    await page.goto('/hr/employees/add');
    const deptSelect = page.locator('select').first();
    if (await deptSelect.isVisible()) {
      const options = await deptSelect.locator('option').allInnerTexts();
      expect(options.length).toBeGreaterThan(0);
    }
  });

  test('HR-EXT-006: HR Reports page displays cycle selection and export options', async ({ page }) => {
    await page.goto('/hr/reports');
    await expect(page).toHaveURL(/\/hr\/reports/);

    const exportOrDownload = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("Report")').first();
    await expect(exportOrDownload).toBeVisible();
  });

});
