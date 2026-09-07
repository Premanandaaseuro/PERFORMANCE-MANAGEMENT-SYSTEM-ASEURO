import { Page, Locator, expect } from '@playwright/test';

export class HrKpisPage {
  readonly page: Page;
  readonly addKpiBtn: Locator;
  readonly searchInput: Locator;
  readonly designationFilter: Locator;
  readonly kpiNameInput: Locator;
  readonly weightageInput: Locator;
  readonly saveKpiBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addKpiBtn = page.locator('button:has-text("Add Master KPI"), button:has-text("Add KPI")').first();
    this.searchInput = page.locator('input[placeholder*="Search"]').first();
    this.designationFilter = page.locator('select').first();
    this.kpiNameInput = page.locator('input[name="kpiName"], input[placeholder*="KPI Name"]').first();
    this.weightageInput = page.locator('input[name="weightage"]').first();
    this.saveKpiBtn = page.locator('button:has-text("Save"), button[type="submit"]').first();
  }

  async goto() {
    await this.page.goto('/hr/kpis');
    await this.page.waitForLoadState('networkidle');
  }
}
