import { Page, Locator, expect } from '@playwright/test';

export class HrEmployeePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly departmentFilter: Locator;
  readonly addEmployeeBtn: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly empCodeInput: Locator;
  readonly passwordInput: Locator;
  readonly roleSelect: Locator;
  readonly departmentSelect: Locator;
  readonly managerSelect: Locator;
  readonly designationSelect: Locator;
  readonly submitBtn: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder*="Search"]').first();
    this.departmentFilter = page.locator('select').first();
    this.addEmployeeBtn = page.locator('a[href="/hr/employees/add"], button:has-text("Add Employee")').first();
    
    // Add employee form elements
    this.nameInput = page.locator('input[name="name"], input[placeholder*="Name"]').first();
    this.emailInput = page.locator('input[name="email"], input[placeholder*="Email"]').first();
    this.phoneInput = page.locator('input[name="phone"], input[placeholder*="Phone"]').first();
    this.empCodeInput = page.locator('input[name="employeeCode"], input[placeholder*="Code"]').first();
    this.passwordInput = page.locator('input[name="password"], input[placeholder*="Password"]').first();
    this.roleSelect = page.locator('select[name="role"]').first();
    this.departmentSelect = page.locator('select[name="department"]').first();
    this.managerSelect = page.locator('select[name="managerId"]').first();
    this.designationSelect = page.locator('select[name="designation"]').first();
    this.submitBtn = page.locator('button[type="submit"]').first();
    this.successMessage = page.locator('.bg-emerald-50, .text-emerald-700, [role="alert"]').first();
  }

  async gotoDirectory() {
    await this.page.goto('/hr/employees');
    await this.page.waitForLoadState('networkidle');
  }

  async gotoAddPage() {
    await this.page.goto('/hr/employees/add');
    await this.page.waitForLoadState('networkidle');
  }

  async searchEmployee(query: string) {
    await this.searchInput.fill(query);
  }

  async fillEmployeeForm(data: {
    name: string;
    email: string;
    phone?: string;
    code?: string;
    password?: string;
    role?: string;
  }) {
    if (data.name) await this.nameInput.fill(data.name);
    if (data.email) await this.emailInput.fill(data.email);
    if (data.phone && (await this.phoneInput.isVisible())) await this.phoneInput.fill(data.phone);
    if (data.code && (await this.empCodeInput.isVisible())) await this.empCodeInput.fill(data.code);
    if (data.password && (await this.passwordInput.isVisible())) await this.passwordInput.fill(data.password);
  }

  async submitForm() {
    await this.submitBtn.click();
  }
}
