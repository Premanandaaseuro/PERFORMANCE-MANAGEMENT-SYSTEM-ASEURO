import { APIRequestContext } from '@playwright/test';

export class AuthApiClient {
  constructor(private request: APIRequestContext, private baseUrl: string = process.env.API_BASE_URL || 'http://localhost:8081') {}

  async login(email: string, password: string) {
    const response = await this.request.post(`${this.baseUrl}/api/auth/login`, {
      data: { email, password },
    });
    return {
      status: response.status(),
      body: await response.json().catch(() => ({})),
    };
  }

  async forgotPassword(email: string) {
    const response = await this.request.post(`${this.baseUrl}/api/auth/forgot-password`, {
      data: { email },
    });
    return {
      status: response.status(),
      body: await response.json().catch(() => ({})),
    };
  }

  async resetPassword(data: { email: string; token: string; newPassword: string }) {
    const response = await this.request.post(`${this.baseUrl}/api/auth/reset-password`, {
      data,
    });
    return {
      status: response.status(),
      body: await response.json().catch(() => ({})),
    };
  }

  async changePassword(token: string, data: { currentPassword: string; newPassword: string }) {
    const response = await this.request.post(`${this.baseUrl}/api/auth/change-password`, {
      headers: { Authorization: `Bearer ${token}` },
      data,
    });
    return {
      status: response.status(),
      body: await response.json().catch(() => ({})),
    };
  }
}
