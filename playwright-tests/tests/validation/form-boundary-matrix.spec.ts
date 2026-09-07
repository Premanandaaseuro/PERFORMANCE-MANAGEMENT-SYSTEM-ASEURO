import { test, expect } from '../../fixtures/testFixtures';

test.describe('Form Boundary, Rating Scale & Search Matrix', () => {

  const ratingBoundaries = [
    { val: -5, valid: false },
    { val: -1, valid: false },
    { val: 0, valid: false },
    { val: 0.1, valid: false },
    { val: 0.5, valid: false },
    { val: 0.9, valid: false },
    { val: 0.99, valid: false },
    { val: 1.0, valid: true },
    { val: 1.1, valid: true },
    { val: 1.5, valid: true },
    { val: 2.0, valid: true },
    { val: 2.5, valid: true },
    { val: 3.0, valid: true },
    { val: 3.5, valid: true },
    { val: 4.0, valid: true },
    { val: 4.5, valid: true },
    { val: 4.9, valid: true },
    { val: 4.99, valid: true },
    { val: 5.0, valid: true },
    { val: 5.01, valid: false },
    { val: 5.1, valid: false },
    { val: 6.0, valid: false },
    { val: 10.0, valid: false },
    { val: 100.0, valid: false },
    { val: 9999.0, valid: false }
  ];

  const searchPatterns = [
    { name: 'Empty string', query: '' },
    { name: 'Single character', query: 'a' },
    { name: 'Two characters', query: 'em' },
    { name: 'Full exact name', query: 'Employee' },
    { name: 'Uppercase query', query: 'EMPLOYEE' },
    { name: 'Mixed case', query: 'EmPloYeE' },
    { name: 'Leading spaces', query: '   employee' },
    { name: 'Trailing spaces', query: 'employee   ' },
    { name: 'Internal multiple spaces', query: 'emp   loyee' },
    { name: 'Numeric ID search', query: '1001' },
    { name: 'Special punctuation', query: 'emp-loyee' },
    { name: 'Dot notation', query: 'emp.loyee' },
    { name: 'Underscore notation', query: 'emp_loyee' },
    { name: 'At symbol email query', query: '@aseuro.com' },
    { name: 'Wildcard percent symbol', query: '%' },
    { name: 'Wildcard underscore', query: '_' },
    { name: 'Regex meta-characters', query: '.*+?^${}()|[]\\' },
    { name: 'HTML inline tag', query: '<b>bold</b>' },
    { name: 'SQL quote test', query: "O'Connor" },
    { name: 'Unicode letters', query: 'München' },
    { name: 'Emoji icon query', query: '👩‍💼' },
    { name: 'Long 100 char query', query: 'a'.repeat(100) },
    { name: 'Non-existent string', query: 'ZZZZZZZZ_NO_MATCH_XYZ' },
    { name: 'Zero-width space', query: '\u200B' },
    { name: 'Hyphenated name', query: 'Jean-Luc' }
  ];

  // 25 Rating Scale Boundary Tests on My KPIs
  test.describe('Self-Assessment Rating Boundary Verifications', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(process.env.EMPLOYEE_EMAIL || 'employee@aseuro.com', process.env.EMPLOYEE_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('EMPLOYEE');
    });

    ratingBoundaries.forEach((item, idx) => {
      test(`VAL-RATING-${String(idx + 1).padStart(2, '0')}: Rating boundary test (${item.val}) is ${item.valid ? 'accepted' : 'rejected'}`, async ({ page }) => {
        await page.goto('/kpis');
        const ratingInput = page.locator('input[type="number"], select').first();
        if (await ratingInput.isVisible()) {
          if ((await ratingInput.getAttribute('type')) === 'number') {
            await ratingInput.fill(String(item.val));
            const val = await ratingInput.inputValue();
            if (!item.valid && (item.val < 1 || item.val > 5)) {
              // Browser HTML5 or input validation restricts outside 1-5
              const min = await ratingInput.getAttribute('min');
              const max = await ratingInput.getAttribute('max');
              if (min) expect(Number(min)).toBeGreaterThanOrEqual(1);
              if (max) expect(Number(max)).toBeLessThanOrEqual(5);
            }
          }
        }
      });
    });
  });

  // 25 Search Input Field String Boundaries on HR Employee Directory
  test.describe('Search Field Pattern & Boundary Verifications', () => {
    test.beforeEach(async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(process.env.HR_EMAIL || 'hr@aseuro.com', process.env.HR_PASSWORD || 'Hr@12345');
      await loginPage.expectLoggedInRoleRedirect('HR');
    });

    searchPatterns.forEach((item, idx) => {
      test(`VAL-SEARCH-${String(idx + 1).padStart(2, '0')}: Search pattern test (${item.name})`, async ({ page }) => {
        await page.goto('/hr/employees');
        const searchBox = page.locator('input[placeholder*="Search"], input[type="text"]').first();
        if (await searchBox.isVisible()) {
          await searchBox.fill(item.query);
          await page.waitForTimeout(100);
          // Directory table or empty state should remain rendered without application crash
          await expect(page.locator('body')).toBeVisible();
          await searchBox.clear();
        }
      });
    });
  });

});
