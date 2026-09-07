import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly togglePasswordButton: Locator;
  readonly errorMessageAlert: Locator;
  readonly companyHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[placeholder="Enter your email address"], input[type="email"], input[name="email"]').first();
    this.passwordInput = page.locator('input[placeholder="Enter your password"], input[autoComplete="current-password"], input[type="password"]').first();
    this.loginButton = page.locator('button[type="submit"]').first();
    this.togglePasswordButton = page.locator('button:has-text("Show"), button:has-text("Hide")').first();
    this.errorMessageAlert = page.locator('.bg-rose-50, .text-rose-600, .bg-red-500, [role="alert"]').first();
    this.companyHeader = page.locator('h1, h2, img[alt*="logo"]').first();
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async navigate() {
    await this.goto();
  }

  async login(email: string, password: string) {
    if (email) await this.emailInput.fill(email);
    else await this.emailInput.clear();

    if (password) await this.passwordInput.fill(password);
    else await this.passwordInput.clear();

    await this.loginButton.click();
  }

  async togglePasswordVisibility() {
    await this.togglePasswordButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessageAlert.textContent();
  }

  async expectLoggedInRoleRedirect(role: 'HR' | 'MANAGER' | 'EMPLOYEE') {
    if (role === 'HR') {
      await expect(this.page).toHaveURL(/\/hr\/dashboard/);
    } else if (role === 'MANAGER') {
      await expect(this.page).toHaveURL(/\/manager\/dashboard/);
    } else {
      await expect(this.page).toHaveURL(/\/dashboard/);
    }
  }
}
