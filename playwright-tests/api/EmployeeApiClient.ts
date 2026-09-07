import { APIRequestContext } from '@playwright/test';

export class EmployeeApiClient {
  constructor(private request: APIRequestContext, private baseUrl: string = process.env.API_BASE_URL || 'http://localhost:8081') {}

  async getDashboard(token: string) {
    return this.request.get(`${this.baseUrl}/employee/pms/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getCurrentAssignment(token: string) {
    return this.request.get(`${this.baseUrl}/employee/pms/current`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async saveDraft(token: string, assignmentId: number, payload: any) {
    return this.request.put(`${this.baseUrl}/employee/pms/${assignmentId}/draft`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async submitAssessment(token: string, assignmentId: number, payload: any) {
    return this.request.post(`${this.baseUrl}/employee/pms/${assignmentId}/submit`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async getHistory(token: string) {
    return this.request.get(`${this.baseUrl}/employee/pms/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
