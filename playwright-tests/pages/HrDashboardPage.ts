import { Page, Locator, expect } from '@playwright/test';

export class HrDashboardPage {
  readonly page: Page;
  readonly totalEmployeesCard: Locator;
  readonly activePmsCard: Locator;
  readonly pendingReviewsCard: Locator;
  readonly addEmployeeQuickBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.totalEmployeesCard = page.locator('text=Total Employees').locator('..');
    this.activePmsCard = page.locator('text=Active PMS Cycles').locator('..');
    this.pendingReviewsCard = page.locator('text=Pending HR Reviews').locator('..');
    this.addEmployeeQuickBtn = page.locator('a[href="/hr/employees/add"], button:has-text("Add Employee")').first();
  }

  async goto() {
    await this.page.goto('/hr/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyDashboardLoaded() {
    await expect(this.page).toHaveURL(/\/hr\/dashboard/);
    await expect(this.page.locator('h1, h2').filter({ hasText: /HR|Dashboard/i }).first()).toBeVisible();
  }
}
