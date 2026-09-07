import { Page, Locator, expect } from '@playwright/test';

export class ManagerKpiReviewPage {
  readonly page: Page;
  readonly ratingInputs: Locator;
  readonly commentInputs: Locator;
  readonly submitReviewBtn: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ratingInputs = page.locator('input[type="number"][min="1"][max="5"]');
    this.commentInputs = page.locator('textarea, input[placeholder*="comment" i]');
    this.submitReviewBtn = page.locator('button:has-text("Submit Review"), button:has-text("Submit Ratings")').first();
    this.errorMessage = page.locator('.text-rose-600, .bg-rose-50, [role="alert"]').first();
    this.successMessage = page.locator('.text-emerald-700, .bg-emerald-50').first();
  }

  async goto(employeeId: number) {
    await this.page.goto(`/manager/employees/${employeeId}/review`);
    await this.page.waitForLoadState('networkidle');
  }

  async setRating(index: number, val: string) {
    const input = this.ratingInputs.nth(index);
    await input.fill(val);
  }

  async submitReview() {
    await this.submitReviewBtn.click();
  }
}
