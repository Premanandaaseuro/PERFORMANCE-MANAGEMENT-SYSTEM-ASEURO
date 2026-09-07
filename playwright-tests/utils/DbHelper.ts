import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export class DbHelper {
  private static getClient(): Client {
    return new Client({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5433),
      database: process.env.DB_NAME || 'pms_db',
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }

  public static async query(sql: string, params: any[] = []): Promise<any[]> {
    const client = this.getClient();
    try {
      await client.connect();
      const res = await client.query(sql, params);
      return res.rows;
    } catch (err) {
      console.warn('Database query warning/error:', err);
      return [];
    } finally {
      await client.end().catch(() => {});
    }
  }

  public static async findEmployeeByEmail(email: string) {
    const rows = await this.query('SELECT * FROM employees WHERE email = $1', [email]);
    return rows[0] || null;
  }

  public static async getAssignmentsByEmployee(employeeId: number) {
    return await this.query('SELECT * FROM pms_assignments WHERE employee_id = $1 ORDER BY id DESC', [employeeId]);
  }

  public static async getKpiRatings(assignmentId: number) {
    return await this.query('SELECT * FROM employee_kpi_ratings WHERE assignment_id = $1', [assignmentId]);
  }

  public static async getPmsHistory(employeeId: number) {
    return await this.query('SELECT * FROM pms_history WHERE employee_id = $1 ORDER BY id DESC', [employeeId]);
  }
}
