import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HrDashboardPage } from '../pages/HrDashboardPage';
import { HrEmployeePage } from '../pages/HrEmployeePage';
import { HrKpisPage } from '../pages/HrKpisPage';
import { HrPmsLifecyclePage } from '../pages/HrPmsLifecyclePage';
import { HrReportsPage } from '../pages/HrReportsPage';
import { ManagerDashboardPage } from '../pages/ManagerDashboardPage';
import { ManagerKpiReviewPage } from '../pages/ManagerKpiReviewPage';
import { EmployeeKpiPage } from '../pages/EmployeeKpiPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AuthApiClient } from '../api/AuthApiClient';
import { HrApiClient } from '../api/HrApiClient';
import { ManagerApiClient } from '../api/ManagerApiClient';
import { EmployeeApiClient } from '../api/EmployeeApiClient';
import { DbHelper } from '../utils/DbHelper';

type TestFixtures = {
  loginPage: LoginPage;
  hrDashboardPage: HrDashboardPage;
  hrEmployeePage: HrEmployeePage;
  hrKpisPage: HrKpisPage;
  hrLifecyclePage: HrPmsLifecyclePage;
  hrReportsPage: HrReportsPage;
  managerDashboardPage: ManagerDashboardPage;
  managerKpiReviewPage: ManagerKpiReviewPage;
  employeeKpiPage: EmployeeKpiPage;
  profilePage: ProfilePage;
  authApi: AuthApiClient;
  hrApi: HrApiClient;
  managerApi: ManagerApiClient;
  employeeApi: EmployeeApiClient;
  db: typeof DbHelper;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  hrDashboardPage: async ({ page }, use) => {
    await use(new HrDashboardPage(page));
  },
  hrEmployeePage: async ({ page }, use) => {
    await use(new HrEmployeePage(page));
  },
  hrKpisPage: async ({ page }, use) => {
    await use(new HrKpisPage(page));
  },
  hrLifecyclePage: async ({ page }, use) => {
    await use(new HrPmsLifecyclePage(page));
  },
  hrReportsPage: async ({ page }, use) => {
    await use(new HrReportsPage(page));
  },
  managerDashboardPage: async ({ page }, use) => {
    await use(new ManagerDashboardPage(page));
  },
  managerKpiReviewPage: async ({ page }, use) => {
    await use(new ManagerKpiReviewPage(page));
  },
  employeeKpiPage: async ({ page }, use) => {
    await use(new EmployeeKpiPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  authApi: async ({ request }, use) => {
    await use(new AuthApiClient(request));
  },
  hrApi: async ({ request }, use) => {
    await use(new HrApiClient(request));
  },
  managerApi: async ({ request }, use) => {
    await use(new ManagerApiClient(request));
  },
  employeeApi: async ({ request }, use) => {
    await use(new EmployeeApiClient(request));
  },
  db: async ({}, use) => {
    await use(DbHelper);
  },
});

export { expect } from '@playwright/test';
