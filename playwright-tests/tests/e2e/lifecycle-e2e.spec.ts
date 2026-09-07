import { test, expect } from '../../fixtures/testFixtures';
import { Page } from '@playwright/test';

async function performLogout(page: Page) {
  try {
    const logoutBtn = page.locator('button:has-text("Logout"), aside button:has-text("Logout")').first();
    if (await logoutBtn.isVisible({ timeout: 1000 })) {
      await logoutBtn.click();
      await page.waitForURL(/\/login/, { timeout: 3000 });
      return;
    }
  } catch (e) {
    // fallback to storage clearing
  }
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
}

test.describe('End-to-End Multi-Role PMS Lifecycle Workflows', () => {

  test('E2E-001: Complete PMS journey across roles (HR -> Employee -> Manager)', async ({ page, loginPage }) => {
    // Step 1: HR checks active dashboard & system status
    await loginPage.navigate();
    await loginPage.login(process.env.HR_EMAIL || 'hr@aseuro.com', process.env.HR_PASSWORD || 'Hr@12345');
    await expect(page).toHaveURL(/\/hr\/dashboard/);
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Verify HR can see overview stats
    const metricCards = page.locator('.grid').first();
    await expect(metricCards).toBeVisible();

    // HR logs out
    await performLogout(page);
    await expect(page).toHaveURL(/\/login/);

    // Step 2: Employee logs in and navigates to KPIs
    await loginPage.login(process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com', process.env.EMPLOYEE_PASSWORD || 'Hr@12345');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Navigate to My KPIs
    await page.goto('/kpis');
    await expect(page).toHaveURL(/\/kpis/);
    await expect(page.locator('body')).toBeVisible();

    // Verify rating buttons or KPI container is loaded
    const kpiSection = page.locator('main, .min-h-screen').first();
    await expect(kpiSection).toBeVisible();

    // Employee logs out
    await performLogout(page);
    await expect(page).toHaveURL(/\/login/);

    // Step 3: Manager logs in and verifies team reviews
    await loginPage.login(process.env.MANAGER_EMAIL || 'manager@aseuro.com', process.env.MANAGER_PASSWORD || 'Hr@12345');
    await expect(page).toHaveURL(/\/manager\/dashboard/);
    
    // Navigate to Assigned Employees
    await page.goto('/manager/employees');
    await expect(page).toHaveURL(/\/manager\/employees/);
    await expect(page.locator('body')).toBeVisible();

    // Manager logs out
    await performLogout(page);
    await expect(page).toHaveURL(/\/login/);
  });

  test('E2E-002: Sequential role session switching preserves authorization boundaries', async ({ page, loginPage }) => {
    // 1. Employee tries to access /hr/dashboard -> redirected to /unauthorized
    await loginPage.navigate();
    await loginPage.login(process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com', process.env.EMPLOYEE_PASSWORD || 'Hr@12345');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/hr/dashboard');
    await expect(page).toHaveURL(/\/unauthorized/);

    // Logout
    await performLogout(page);

    // 2. HR logs in and accesses /hr/dashboard successfully
    await loginPage.navigate();
    await loginPage.login(process.env.HR_EMAIL || 'hr@aseuro.com', process.env.HR_PASSWORD || 'Hr@12345');
    await expect(page).toHaveURL(/\/hr\/dashboard/);

    await performLogout(page);
  });

  test('E2E-003: Clean logout terminates session and prevents back-button replay', async ({ page, loginPage }) => {
    await loginPage.navigate();
    await loginPage.login(process.env.HR_EMAIL || 'hr@aseuro.com', process.env.HR_PASSWORD || 'Hr@12345');
    await expect(page).toHaveURL(/\/hr\/dashboard/);

    // Click logout
    const logoutBtn = page.locator('button:has-text("Logout"), aside button:has-text("Logout")').first();
    await logoutBtn.click();
    await expect(page).toHaveURL(/\/login/);

    // Try going back in browser history
    await page.goBack();
    // Verify user cannot see private dashboard and is redirected to /login
    await page.waitForTimeout(500);
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(login|unauthorized)/);
  });

});
