import { APIRequestContext } from '@playwright/test';

export class ManagerApiClient {
  constructor(private request: APIRequestContext, private baseUrl: string = process.env.API_BASE_URL || 'http://localhost:8081') {}

  async getDashboard(token: string) {
    return this.request.get(`${this.baseUrl}/api/manager/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getEmployees(token: string) {
    return this.request.get(`${this.baseUrl}/api/manager/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getEmployeePms(token: string, employeeId: number) {
    return this.request.get(`${this.baseUrl}/api/manager/employees/${employeeId}/pms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async submitReview(token: string, assignmentId: number, payload: any) {
    return this.request.post(`${this.baseUrl}/api/manager/pms/${assignmentId}/submit`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }
}
