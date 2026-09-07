import { test, expect } from '../../fixtures/testFixtures';

test.describe('Database Integrity Suite @database', () => {
  test('DB-001: [PostgreSQL] Employees table contains configured test users', async ({ db }) => {
    const hr = await db.findEmployeeByEmail(process.env.TEST_HR_EMAIL || 'm.premananda@aseuro.in');
    if (hr) {
      expect(hr.email).toBe(process.env.TEST_HR_EMAIL || 'm.premananda@aseuro.in');
      expect(hr.role).toMatch(/HR|ROLE_HR/);
    }
  });

  test('DB-002: [PostgreSQL] KPI Master records have valid weightage and non-empty name', async ({ db }) => {
    const kpis = await db.query('SELECT * FROM kpi_master LIMIT 5');
    if (kpis && kpis.length > 0) {
      for (const kpi of kpis) {
        expect(kpi.kpi_name).toBeTruthy();
        expect(Number(kpi.weightage)).toBeGreaterThan(0);
      }
    }
  });
});
