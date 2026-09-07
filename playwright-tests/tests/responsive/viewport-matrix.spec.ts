import { test, expect } from '../../fixtures/testFixtures';

test.describe('Comprehensive Responsive & Cross-Device Viewport Matrix', () => {

  const viewports = [
    { name: 'Desktop Ultra (1920x1080)', width: 1920, height: 1080 },
    { name: 'MacBook Pro (1440x900)', width: 1440, height: 900 },
    { name: 'Standard Laptop (1366x768)', width: 1366, height: 768 },
    { name: 'Compact Laptop (1280x800)', width: 1280, height: 800 },
    { name: 'Tablet Landscape (1024x768)', width: 1024, height: 768 },
    { name: 'Tablet Portrait (768x1024)', width: 768, height: 1024 },
    { name: 'Mobile Large (414x896)', width: 414, height: 896 },
    { name: 'Mobile Compact (375x667)', width: 375, height: 667 }
  ];

  // 1. Login Page Viewport Tests (8 cases)
  viewports.forEach((vp, idx) => {
    test(`RESP-LOGIN-${String(idx + 1).padStart(2, '0')}: Login renders correctly at ${vp.name}`, async ({ page, loginPage }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginPage.goto();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
    });
  });

  // 2. Employee Dashboard Viewport Tests (8 cases)
  viewports.forEach((vp, idx) => {
    test(`RESP-EMP-DASH-${String(idx + 1).padStart(2, '0')}: Employee Dashboard renders at ${vp.name}`, async ({ page, loginPage }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginPage.goto();
      await loginPage.login(process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com', process.env.EMPLOYEE_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('EMPLOYEE');
      await expect(page.locator('main, .min-h-screen').first()).toBeVisible();
    });
  });

  // 3. Employee My KPIs Viewport Tests (8 cases)
  viewports.forEach((vp, idx) => {
    test(`RESP-EMP-KPIS-${String(idx + 1).padStart(2, '0')}: Employee My KPIs renders at ${vp.name}`, async ({ page, loginPage }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginPage.goto();
      await loginPage.login(process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com', process.env.EMPLOYEE_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('EMPLOYEE');
      await page.goto('/kpis');
      await expect(page.locator('main, .min-h-screen').first()).toBeVisible();
    });
  });

  // 4. HR Dashboard Viewport Tests (8 cases)
  viewports.forEach((vp, idx) => {
    test(`RESP-HR-DASH-${String(idx + 1).padStart(2, '0')}: HR Dashboard renders at ${vp.name}`, async ({ page, loginPage }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginPage.goto();
      await loginPage.login(process.env.HR_EMAIL || 'hr@aseuro.com', process.env.HR_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('HR');
      await expect(page.locator('main, .min-h-screen').first()).toBeVisible();
    });
  });

  // 5. Manager Dashboard Viewport Tests (8 cases)
  viewports.forEach((vp, idx) => {
    test(`RESP-MGR-DASH-${String(idx + 1).padStart(2, '0')}: Manager Dashboard renders at ${vp.name}`, async ({ page, loginPage }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginPage.goto();
      await loginPage.login(process.env.MANAGER_EMAIL || 'manager@aseuro.com', process.env.MANAGER_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('MANAGER');
      await expect(page.locator('main, .min-h-screen').first()).toBeVisible();
    });
  });

});
