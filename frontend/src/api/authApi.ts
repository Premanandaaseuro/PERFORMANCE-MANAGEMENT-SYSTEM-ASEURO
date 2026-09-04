import apiClient from './apiClient';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
  role?: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await apiClient.post<User>('/auth/login', credentials);
    return response.data;
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (email: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', { email, newPassword });
    return response.data;
  },
  resetLockout: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-lockout', { email });
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword?: string): Promise<{ message: string; mustChangePassword?: boolean }> => {
    const response = await apiClient.post<{ message: string; mustChangePassword?: boolean }>('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return response.data;
  }
};
