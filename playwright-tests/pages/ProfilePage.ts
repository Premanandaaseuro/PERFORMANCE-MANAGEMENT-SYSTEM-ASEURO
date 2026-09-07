import { Page, Locator, expect } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly nameDisplay: Locator;
  readonly emailDisplay: Locator;
  readonly roleBadge: Locator;
  readonly changePasswordBtn: Locator;
  readonly oldPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly savePasswordBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameDisplay = page.locator('h1, h2').first();
    this.emailDisplay = page.locator('text=@aseuro.in, text=@').first();
    this.roleBadge = page.locator('.bg-emerald-100, .bg-blue-100, .bg-purple-100').first();
    this.changePasswordBtn = page.locator('button:has-text("Change Password")').first();
    this.oldPasswordInput = page.locator('input[placeholder*="Current"], input[name="currentPassword"]').first();
    this.newPasswordInput = page.locator('input[placeholder*="New Password"], input[name="newPassword"]').first();
    this.confirmPasswordInput = page.locator('input[placeholder*="Confirm"], input[name="confirmPassword"]').first();
    this.savePasswordBtn = page.locator('button:has-text("Update Password"), button[type="submit"]').first();
  }

  async goto() {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }
}
