import { test, expect } from '../../fixtures/testFixtures';

test.describe('Smoke Test Suite @smoke', () => {
  test('SMOKE-001: Web App frontend loads login page cleanly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Performance|PMS|Aseuro/i);
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('SMOKE-002: Backend API health check responds', async ({ request }) => {
    const res = await request.get('http://localhost:8081/api/auth/login');
    // GET on login endpoint returns 403 Forbidden or 405 Method Not Allowed, confirming API server is running
    expect([400, 403, 405]).toContain(res.status());
  });
});
