import { Page, Locator, expect } from '@playwright/test';

export class HrReportsPage {
  readonly page: Page;
  readonly overallCycleTabBtn: Locator;
  readonly individualReportsTabBtn: Locator;
  readonly cycleMonthSelect: Locator;
  readonly searchInput: Locator;
  readonly excelDownloadBtn: Locator;
  readonly pdfDownloadBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.overallCycleTabBtn = page.locator('button:has-text("Overall PMS Cycle Report")').first();
    this.individualReportsTabBtn = page.locator('button:has-text("Individual Employee Reports")').first();
    this.cycleMonthSelect = page.locator('select').first();
    this.searchInput = page.locator('input[placeholder*="Search"]').first();
    this.excelDownloadBtn = page.locator('button:has-text("Excel")').first();
    this.pdfDownloadBtn = page.locator('button:has-text("PDF")').first();
  }

  async goto() {
    await this.page.goto('/hr/reports');
    await this.page.waitForLoadState('networkidle');
  }
}
