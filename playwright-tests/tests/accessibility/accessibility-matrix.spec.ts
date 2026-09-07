import { test, expect } from '../../fixtures/testFixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Automated WCAG Accessibility Matrix Across Application', () => {

  const publicPages = [
    { name: 'Login Page', path: '/login' },
    { name: 'Unauthorized Page', path: '/unauthorized' },
    { name: 'Session Expired Page', path: '/session-expired' },
    { name: '404 Page Not Found', path: '/unknown-not-found-route' }
  ];

  const employeePages = [
    { name: 'Employee Dashboard', path: '/dashboard' },
    { name: 'Employee My KPIs', path: '/kpis' },
    { name: 'Employee History', path: '/history' },
    { name: 'Employee Reports', path: '/reports' },
    { name: 'Employee Profile', path: '/profile' }
  ];

  const managerPages = [
    { name: 'Manager Dashboard', path: '/manager/dashboard' },
    { name: 'Manager My KPIs', path: '/manager/my-kpis' },
    { name: 'Manager Assigned Employees', path: '/manager/employees' },
    { name: 'Manager Reports', path: '/manager/reports' }
  ];

  const hrPages = [
    { name: 'HR Dashboard', path: '/hr/dashboard' },
    { name: 'HR Employee Directory', path: '/hr/employees' },
    { name: 'HR Add Employee', path: '/hr/employees/add' },
    { name: 'HR KPI Library', path: '/hr/kpis' },
    { name: 'HR Managers Directory', path: '/hr/managers' },
    { name: 'HR PMS Lifecycle', path: '/hr/pms-lifecycle' },
    { name: 'HR Reports', path: '/hr/reports' }
  ];

  // 1. Public Pages A11y (4 cases)
  publicPages.forEach((p, idx) => {
    test(`A11Y-PUB-${String(idx + 1).padStart(2, '0')}: WCAG audit on ${p.name}`, async ({ page }) => {
      await page.goto(p.path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast']) // avoid branding color contrast variations
        .analyze();
      expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
    });
  });

  // 2. Employee Pages A11y (5 cases)
  test.describe('Employee Pages Accessibility', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com', process.env.EMPLOYEE_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('EMPLOYEE');
    });

    employeePages.forEach((p, idx) => {
      test(`A11Y-EMP-${String(idx + 1).padStart(2, '0')}: WCAG audit on ${p.name}`, async ({ page }) => {
        await page.goto(p.path);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast'])
          .analyze();
        expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
      });
    });
  });

  // 3. Manager Pages A11y (4 cases)
  test.describe('Manager Pages Accessibility', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(process.env.MANAGER_EMAIL || 'manager@aseuro.com', process.env.MANAGER_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('MANAGER');
    });

    managerPages.forEach((p, idx) => {
      test(`A11Y-MGR-${String(idx + 1).padStart(2, '0')}: WCAG audit on ${p.name}`, async ({ page }) => {
        await page.goto(p.path);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast'])
          .analyze();
        expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
      });
    });
  });

  // 4. HR Pages A11y (7 cases)
  test.describe('HR Pages Accessibility', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(process.env.HR_EMAIL || 'hr@aseuro.com', process.env.HR_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('HR');
    });

    hrPages.forEach((p, idx) => {
      test(`A11Y-HR-${String(idx + 1).padStart(2, '0')}: WCAG audit on ${p.name}`, async ({ page }) => {
        await page.goto(p.path);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .disableRules(['color-contrast'])
          .analyze();
        expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
      });
    });
  });

});
