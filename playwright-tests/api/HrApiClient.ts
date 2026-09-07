import { APIRequestContext } from '@playwright/test';

export class HrApiClient {
  constructor(private request: APIRequestContext, private baseUrl: string = process.env.API_BASE_URL || 'http://localhost:8081') {}

  async getDashboard(token: string) {
    return this.request.get(`${this.baseUrl}/api/hr/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getEmployees(token: string) {
    return this.request.get(`${this.baseUrl}/api/hr/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async addEmployee(token: string, payload: any) {
    return this.request.post(`${this.baseUrl}/api/hr/employees`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async updateEmployee(token: string, id: number, payload: any) {
    return this.request.put(`${this.baseUrl}/api/hr/employees/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async getKpis(token: string) {
    return this.request.get(`${this.baseUrl}/api/hr/kpis`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async createKpi(token: string, payload: any) {
    return this.request.post(`${this.baseUrl}/api/hr/kpis`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async initiateCycle(token: string, payload: any) {
    return this.request.post(`${this.baseUrl}/api/hr/lifecycle/initiate-cycle`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async getCycleOverallReport(token: string, cycleMonth: string = 'ALL') {
    return this.request.get(`${this.baseUrl}/api/hr/reports/cycle/view?cycleMonth=${encodeURIComponent(cycleMonth)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
