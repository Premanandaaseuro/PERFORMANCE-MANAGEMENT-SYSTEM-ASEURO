import { test, expect } from '../../fixtures/testFixtures';

test.describe('Manager Module Suite @manager', () => {
  const mgrEmail = process.env.TEST_MANAGER_EMAIL || 'manager@aseuro.com';
  const mgrPass = process.env.TEST_MANAGER_PASSWORD || 'Hr@12345';

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(mgrEmail, mgrPass);
    await loginPage.expectLoggedInRoleRedirect('MANAGER');
  });

  test('MGR-001: [UI] Manager Dashboard renders team summary and pending reviews', async ({ managerDashboardPage }) => {
    await managerDashboardPage.goto();
    await managerDashboardPage.verifyLoaded();
  });

  test('MGR-002: [Validation] Manager KPI review enforces rating between 1.0 and 5.0 (rejecting 0)', async ({ page }) => {
    await page.goto('/manager/employees');
    const firstReviewLink = page.locator('a[href*="/review"], button:has-text("Review")').first();
    if (await firstReviewLink.isVisible()) {
      await firstReviewLink.click();
      await page.waitForLoadState('networkidle');
      const ratingInput = page.locator('input[type="number"]').first();
      if (await ratingInput.isVisible() && !(await ratingInput.isDisabled())) {
        await ratingInput.fill('0');
        const errorText = page.locator('.text-rose-600, .bg-rose-50, [role="alert"]').first();
        await expect(errorText).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('MGR-003: [RBAC] Manager cannot access HR dashboard or HR admin pages', async ({ page }) => {
    await page.goto('/hr/dashboard');
    await expect(page).toHaveURL(/\/unauthorized|\/manager\/dashboard/);
  });
});
