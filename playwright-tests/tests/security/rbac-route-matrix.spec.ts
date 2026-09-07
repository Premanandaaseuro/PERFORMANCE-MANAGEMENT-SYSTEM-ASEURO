import { test, expect } from '../../fixtures/testFixtures';

test.describe('Role-Based Access Control (RBAC) Comprehensive Route Matrix', () => {

  const protectedRoutes = [
    { path: '/dashboard', requiredRole: 'EMPLOYEE' },
    { path: '/kpis', requiredRole: 'EMPLOYEE' },
    { path: '/history', requiredRole: 'EMPLOYEE' },
    { path: '/reports', requiredRole: 'EMPLOYEE' },
    { path: '/profile', requiredRole: 'EMPLOYEE' },
    { path: '/manager/dashboard', requiredRole: 'MANAGER' },
    { path: '/manager/my-kpis', requiredRole: 'MANAGER' },
    { path: '/manager/employees', requiredRole: 'MANAGER' },
    { path: '/manager/reports', requiredRole: 'MANAGER' },
    { path: '/hr/dashboard', requiredRole: 'HR' },
    { path: '/hr/employees', requiredRole: 'HR' },
    { path: '/hr/employees/add', requiredRole: 'HR' },
    { path: '/hr/kpis', requiredRole: 'HR' },
    { path: '/hr/managers', requiredRole: 'HR' },
    { path: '/hr/pms-lifecycle', requiredRole: 'HR' },
    { path: '/hr/reports', requiredRole: 'HR' }
  ];

  // 1. ANONYMOUS ROLE (16 cases) - Must be redirected to /login
  protectedRoutes.forEach((route) => {
    test(`RBAC-ANON-ROUTE-${route.path.replace(/\//g, '_')}: Anonymous access to ${route.path} redirected to /login`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForTimeout(300);
      expect(page.url()).toContain('/login');
    });
  });

  // 2. EMPLOYEE ROLE (16 cases)
  // Employee accessing Employee routes -> Allowed. Accessing HR/Manager -> /unauthorized
  test.describe('Employee Role Route Access Matrix', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com', process.env.EMPLOYEE_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('EMPLOYEE');
    });

    protectedRoutes.forEach((route) => {
      test(`RBAC-EMP-ROUTE-${route.path.replace(/\//g, '_')}: Employee navigation to ${route.path}`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForTimeout(300);
        const url = page.url();
        if (route.requiredRole === 'HR' || route.requiredRole === 'MANAGER') {
          expect(url).toContain('/unauthorized');
        } else {
          expect(url).toContain(route.path);
        }
      });
    });
  });

  // 3. MANAGER ROLE (16 cases)
  // Manager accessing Manager/Employee routes -> Allowed. Accessing HR -> /unauthorized
  test.describe('Manager Role Route Access Matrix', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(process.env.MANAGER_EMAIL || 'manager@aseuro.com', process.env.MANAGER_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('MANAGER');
    });

    protectedRoutes.forEach((route) => {
      test(`RBAC-MGR-ROUTE-${route.path.replace(/\//g, '_')}: Manager navigation to ${route.path}`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForTimeout(300);
        const url = page.url();
        if (route.requiredRole === 'HR') {
          expect(url).toContain('/unauthorized');
        } else {
          expect(url).not.toContain('/unauthorized');
        }
      });
    });
  });

  // 4. HR ROLE (16 cases)
  // HR accessing HR/Employee routes -> Allowed
  test.describe('HR Role Route Access Matrix', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(process.env.HR_EMAIL || 'hr@aseuro.com', process.env.HR_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('HR');
    });

    protectedRoutes.forEach((route) => {
      test(`RBAC-HR-ROUTE-${route.path.replace(/\//g, '_')}: HR navigation to ${route.path}`, async ({ page }) => {
        await page.goto(route.path);
        await page.waitForTimeout(300);
        const url = page.url();
        if (route.requiredRole === 'HR') {
          expect(url).toContain(route.path);
        }
      });
    });
  });

});
