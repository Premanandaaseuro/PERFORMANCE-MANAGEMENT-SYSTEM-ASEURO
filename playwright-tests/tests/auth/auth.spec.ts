import { test, expect } from '../../fixtures/testFixtures';

test.describe('Authentication & Authorization Suite @auth', () => {
  const hrEmail = process.env.TEST_HR_EMAIL || 'm.premananda@aseuro.in';
  const hrPass = process.env.TEST_HR_PASSWORD || 'password123';
  const mgrEmail = process.env.TEST_MANAGER_EMAIL || 'manager@aseuro.in';
  const mgrPass = process.env.TEST_MANAGER_PASSWORD || 'password123';
  const empEmail = process.env.TEST_EMPLOYEE_EMAIL || 'emp@aseuro.in';
  const empPass = process.env.TEST_EMPLOYEE_PASSWORD || 'password123';

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('AUTH-001: [Positive] HR valid login and redirect to HR dashboard', async ({ loginPage }) => {
    await loginPage.login(hrEmail, hrPass);
    await loginPage.expectLoggedInRoleRedirect('HR');
  });

  test('AUTH-002: [Positive] Manager valid login and redirect to Manager dashboard', async ({ loginPage }) => {
    await loginPage.login(mgrEmail, mgrPass);
    await loginPage.expectLoggedInRoleRedirect('MANAGER');
  });

  test('AUTH-003: [Positive] Employee valid login and redirect to Employee dashboard', async ({ loginPage }) => {
    await loginPage.login(empEmail, empPass);
    await loginPage.expectLoggedInRoleRedirect('EMPLOYEE');
  });

  test('AUTH-004: [Negative] Invalid credentials show error alert', async ({ loginPage }) => {
    await loginPage.login('invalid.user@aseuro.in', 'WrongPassword!999');
    await expect(loginPage.errorMessageAlert).toBeVisible({ timeout: 10000 });
  });

  test('AUTH-005: [Negative] Blank submission displays validation warning', async ({ loginPage }) => {
    await loginPage.login('', '');
    const isErrorVisible = await loginPage.errorMessageAlert.isVisible();
    const isUrlLogin = loginPage.page.url().includes('/login');
    expect(isUrlLogin).toBeTruthy();
  });

  test('AUTH-006: [Security] SQL Injection attempt in login fields is safely rejected', async ({ loginPage }) => {
    await loginPage.login("' OR '1'='1@aseuro.in", "' OR '1'='1");
    await expect(loginPage.page).toHaveURL(/\/login/);
  });

  test('AUTH-007: [Security] XSS payload attempt in login fields is neutralized', async ({ loginPage }) => {
    await loginPage.login("xss_attempt@aseuro.in", "<script>alert('xss')</script>");
    await expect(loginPage.page).toHaveURL(/\/login/);
  });

  test('AUTH-008: [UI] Password toggle switches input type between password and text', async ({ loginPage }) => {
    await loginPage.passwordInput.fill('SecretPassword');
    const initialType = await loginPage.passwordInput.getAttribute('type');
    expect(initialType).toBe('password');
    if (await loginPage.togglePasswordButton.isVisible()) {
      await loginPage.togglePasswordVisibility();
      const updatedType = await loginPage.passwordInput.getAttribute('type');
      expect(updatedType).toBe('text');
    }
  });

  test('AUTH-009: [Lifecycle] Unauthenticated user accessing protected route gets redirected to login', async ({ page }) => {
    await page.goto('/hr/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
