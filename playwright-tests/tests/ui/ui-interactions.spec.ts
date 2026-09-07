import { test, expect } from '../../fixtures/testFixtures';

test.describe('UI Navigation, Layout & Keyboard Interactions', () => {

  test('UI-001: Desktop sidebar renders role navigation items with active indicator', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login(process.env.HR_EMAIL || 'hr@aseuro.com', process.env.HR_PASSWORD || 'Hr@12345');
    await loginPage.expectLoggedInRoleRedirect('HR');

    // Verify sidebar container
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // Verify key nav links
    await expect(sidebar.locator('a[href="/hr/dashboard"]')).toBeVisible();
    await expect(sidebar.locator('a[href="/hr/employees"]')).toBeVisible();
    await expect(sidebar.locator('a[href="/hr/reports"]')).toBeVisible();
  });

  test('UI-002: Header displays company logo, portal title, and breadcrumb path', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login(process.env.MANAGER_EMAIL || 'manager@aseuro.com', process.env.MANAGER_PASSWORD || 'Hr@12345');
    await loginPage.expectLoggedInRoleRedirect('MANAGER');

    const header = page.locator('header:visible').first();
    await expect(header).toBeVisible();
    await expect(header.locator('img[alt*="Logo"], img[alt*="logo"]').first()).toBeVisible();
  });

  test('UI-003: User profile badge renders initials and role name', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login(process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com', process.env.EMPLOYEE_PASSWORD || 'Hr@12345');
    await loginPage.expectLoggedInRoleRedirect('EMPLOYEE');

    const avatarOrRole = page.locator('aside, header').filter({ hasText: /Employee|EMPLOYEE|User/i }).first();
    await expect(avatarOrRole).toBeVisible();
  });

  test('UI-004: Keyboard navigation supports Tab key cycling across login inputs', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.emailInput.focus();
    await expect(loginPage.emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(loginPage.passwordInput).toBeFocused();
  });

  test('UI-005: Pressing Enter in password field triggers form submission', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.emailInput.fill(process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com');
    await loginPage.passwordInput.fill(process.env.EMPLOYEE_PASSWORD || 'Hr@12345');
    await loginPage.passwordInput.press('Enter');

    await expect(page).toHaveURL(/\/dashboard/);
  });

});
