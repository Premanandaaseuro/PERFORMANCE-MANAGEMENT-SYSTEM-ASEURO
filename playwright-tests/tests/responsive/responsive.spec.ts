import { test, expect } from '../../fixtures/testFixtures';

const viewports = [
  { name: 'Desktop Large', width: 1920, height: 1080 },
  { name: 'Desktop Standard', width: 1366, height: 768 },
  { name: 'Laptop Small', width: 1280, height: 720 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Mobile Standard', width: 390, height: 844 },
];

test.describe('Responsive Design Suite @responsive', () => {
  for (const vp of viewports) {
    test(`RESP-001: Login page layout adapts to ${vp.name} (${vp.width}x${vp.height})`, async ({ page, loginPage }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginPage.goto();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
    });
  }
});
