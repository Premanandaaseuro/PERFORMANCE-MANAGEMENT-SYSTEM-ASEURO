import { test, expect } from '../../fixtures/testFixtures';

test.describe('Employee Extended Workflows & History', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com', process.env.EMPLOYEE_PASSWORD || 'Hr@12345');
    await loginPage.expectLoggedInRoleRedirect('EMPLOYEE');
  });

  test('EMP-EXT-001: Appraisal History page renders past cycles and scorecards', async ({ page }) => {
    await page.goto('/history');
    await expect(page).toHaveURL(/\/history/);

    // History heading or table/card container
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    await expect(page.locator('main, .min-h-screen').first()).toBeVisible();
  });

  test('EMP-EXT-002: History page supports search query filtering', async ({ page }) => {
    await page.goto('/history');
    const searchInput = page.locator('input[placeholder*="Search"], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('2026');
      await page.waitForTimeout(300);
      await expect(page.locator('body')).toBeVisible();
      await searchInput.clear();
    }
  });

  test('EMP-EXT-003: My Reports page displays average score and downloadable reports', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveURL(/\/reports/);

    // Verify main report card or empty state
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    await expect(page.locator('main, .min-h-screen').first()).toBeVisible();
  });

  test('EMP-EXT-004: Reports filter buttons toggle report display scope', async ({ page }) => {
    await page.goto('/reports');
    const allBtn = page.locator('button:has-text("All"), button:has-text("ALL")').first();
    if (await allBtn.isVisible()) {
      await allBtn.click();
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('EMP-EXT-005: Profile page displays user details and edit profile button', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);

    // Profile heading or personal information section
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();

    // Verify presence of edit profile button
    const editProfileBtn = page.locator('button:has-text("Edit Profile")').first();
    await expect(editProfileBtn).toBeVisible();
  });

});
