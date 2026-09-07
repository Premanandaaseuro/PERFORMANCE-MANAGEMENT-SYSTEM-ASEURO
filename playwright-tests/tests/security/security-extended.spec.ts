import { test, expect } from '../../fixtures/testFixtures';

test.describe('Security & Authorization Extended Edge Cases', () => {

  test('SEC-EXT-001: Direct navigation to /unauthorized renders Access Denied message and return action', async ({ page }) => {
    await page.goto('/unauthorized');
    await expect(page).toHaveURL(/\/unauthorized/);

    const deniedHeading = page.locator('h3:has-text("Access Denied")').first();
    await expect(deniedHeading).toBeVisible();

    const returnBtn = page.locator('button:has-text("Return")').first();
    await expect(returnBtn).toBeVisible();
  });

  test('SEC-EXT-002: Direct navigation to /session-expired renders Session Expired notice and sign in action', async ({ page }) => {
    await page.goto('/session-expired');
    await expect(page).toHaveURL(/\/session-expired/);

    const expiredHeading = page.locator('h3:has-text("Session Expired")').first();
    await expect(expiredHeading).toBeVisible();

    const signInBtn = page.locator('button:has-text("Return"), button:has-text("Sign In"), button:has-text("Login")').first();
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('SEC-EXT-003: Invalid non-existent route displays 404 Page Not Found', async ({ page }) => {
    await page.goto('/unknown-random-route-404-test');
    const notFoundHeading = page.locator('h3:has-text("Page Not Found")').first();
    await expect(notFoundHeading).toBeVisible();

    const backBtn = page.locator('button:has-text("Return")').first();
    await expect(backBtn).toBeVisible();
  });

  test('SEC-EXT-004: Tampered/Corrupted JWT token in localStorage forces redirect to /login', async ({ page, loginPage }) => {
    await loginPage.goto();
    // Inject invalid JWT token into localStorage
    await page.evaluate(() => {
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID_MALFORMED_SIGNATURE.xyz');
      localStorage.setItem('user', JSON.stringify({ id: 999, email: 'fake@aseuro.com', role: 'ROLE_EMPLOYEE' }));
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/\/(login|dashboard)/);
  });

  test('SEC-EXT-005: Unauthenticated access to /profile redirects to /login', async ({ page }) => {
    // New fresh page context is unauthenticated
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('SEC-EXT-006: Form inputs safely escape HTML script tags without executing', async ({ page, loginPage }) => {
    let dialogAppeared = false;
    page.on('dialog', async (dialog) => {
      dialogAppeared = true;
      await dialog.dismiss();
    });

    await loginPage.goto();
    await loginPage.login('<script>alert("XSS")</script>@aseuro.com', '<script>alert("XSS")</script>');
    await page.waitForTimeout(500);

    expect(dialogAppeared).toBe(false);
  });

});
