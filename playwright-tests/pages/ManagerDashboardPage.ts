import { Page, Locator, expect } from '@playwright/test';

export class ManagerDashboardPage {
  readonly page: Page;
  readonly myKpisCard: Locator;
  readonly teamEmployeesCard: Locator;
  readonly pendingReviewsCard: Locator;
  readonly reviewEmployeeLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.myKpisCard = page.locator('text=My Personal KPIs').locator('..');
    this.teamEmployeesCard = page.locator('text=Team Members').locator('..');
    this.pendingReviewsCard = page.locator('text=Pending Reviews').locator('..');
    this.reviewEmployeeLink = page.locator('a[href*="/manager/employees"]').first();
  }

  async goto() {
    await this.page.goto('/manager/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyLoaded() {
    await expect(this.page).toHaveURL(/\/manager\/dashboard/);
    await expect(this.page.locator('h1, h2').filter({ hasText: /Manager|Dashboard/i })).toBeVisible();
  }
}
