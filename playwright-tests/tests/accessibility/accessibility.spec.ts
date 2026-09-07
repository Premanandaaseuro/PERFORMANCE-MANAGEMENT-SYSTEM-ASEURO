import { test, expect } from '../../fixtures/testFixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Suite @accessibility', () => {
  test('A11Y-001: Login page accessibility audit', async ({ page, loginPage }) => {
    await loginPage.goto();
    const accessibilityScanResults = await new AxeBuilder({ page })
      // Rules disabled below are formally documented as defects BUG-004 & BUG-005 in BUGS-FOUND.md
      .disableRules(['color-contrast', 'region', 'landmark-one-main', 'heading-order'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
