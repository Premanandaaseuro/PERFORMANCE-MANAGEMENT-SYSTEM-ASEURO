import { Page, Locator, expect } from '@playwright/test';

export class HrPmsLifecyclePage {
  readonly page: Page;
  readonly initiateCycleBtn: Locator;
  readonly selectEmployeeDropdown: Locator;
  readonly cycleMonthInput: Locator;
  readonly hrRatingInputs: Locator;
  readonly finalizeBtn: Locator;
  readonly managerPendingBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.initiateCycleBtn = page.locator('button:has-text("Initiate Cycle"), button:has-text("Start New Cycle")').first();
    this.selectEmployeeDropdown = page.locator('select').first();
    this.cycleMonthInput = page.locator('input[type="month"], input[placeholder*="Cycle"]').first();
    this.hrRatingInputs = page.locator('input[type="number"][min="1"][max="5"]');
    this.finalizeBtn = page.locator('button:has-text("Finalize"), button:has-text("Publish")').first();
    this.managerPendingBanner = page.locator('text=Manager review is currently pending').first();
  }

  async goto() {
    await this.page.goto('/hr/pms-lifecycle');
    await this.page.waitForLoadState('networkidle');
  }
}
