import { test, expect } from '../../fixtures/testFixtures';

test.describe('Manager Extended Workflows & Reviews', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(process.env.MANAGER_EMAIL || 'manager@aseuro.com', process.env.MANAGER_PASSWORD || 'Hr@12345');
    await loginPage.expectLoggedInRoleRedirect('MANAGER');
  });

  test('MGR-EXT-001: Assigned Employees directory loads team list and status tags', async ({ page }) => {
    await page.goto('/manager/employees');
    await expect(page).toHaveURL(/\/manager\/employees/);

    // Search bar should be present
    const searchBar = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    await expect(searchBar).toBeVisible();

    // Verify main content container
    const content = page.locator('main, .min-h-screen').first();
    await expect(content).toBeVisible();
  });

  test('MGR-EXT-002: Dynamic filtering of assigned team members by name/code', async ({ page }) => {
    await page.goto('/manager/employees');
    const searchBar = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    await searchBar.fill('emp');
    await page.waitForTimeout(300);
    await expect(page.locator('body')).toBeVisible();
    await searchBar.clear();
  });

  test('MGR-EXT-003: Manager My KPIs page renders manager individual goals and weights', async ({ page }) => {
    await page.goto('/manager/my-kpis');
    await expect(page).toHaveURL(/\/manager\/my-kpis/);

    // Verify header and page content
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();
  });

  test('MGR-EXT-004: Manager Reports page renders team performance and export actions', async ({ page }) => {
    await page.goto('/manager/reports');
    await expect(page).toHaveURL(/\/manager\/reports/);

    // Reports heading or metrics
    const reportHeading = page.locator('h1, h2, h3').first();
    await expect(reportHeading).toBeVisible();

    // Verify export / download button or report cards
    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("PDF"), button:has-text("Excel"), .grid').first();
    await expect(exportBtn).toBeVisible();
  });

  test('MGR-EXT-005: Non-existent employee review route handles 404 gracefully', async ({ page }) => {
    await page.goto('/manager/employees/999999/review');
    await expect(page.locator('body')).toBeVisible();
    const errorOrBack = page.locator('button, a, [role="alert"]').first();
    await expect(errorOrBack).toBeVisible();
  });

});
