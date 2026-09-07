import { Page, Locator, expect } from '@playwright/test';

export class EmployeeKpiPage {
  readonly page: Page;
  readonly ratingInputs: Locator;
  readonly commentsInputs: Locator;
  readonly saveDraftBtn: Locator;
  readonly submitAssessmentBtn: Locator;
  readonly statusBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ratingInputs = page.locator('input[type="number"][min="1"][max="5"]');
    this.commentsInputs = page.locator('textarea, input[placeholder*="comment" i]');
    this.saveDraftBtn = page.locator('button:has-text("Save Draft")').first();
    this.submitAssessmentBtn = page.locator('button:has-text("Submit Assessment"), button:has-text("Submit Final")').first();
    this.statusBadge = page.locator('span:has-text("DRAFT"), span:has-text("SUBMITTED"), span:has-text("COMPLETED")').first();
  }

  async goto() {
    await this.page.goto('/kpis');
    await this.page.waitForLoadState('networkidle');
  }
}
