import apiClient from './apiClient';
import { Employee } from '../types';

export const employeeApi = {
  getProfile: async (): Promise<Employee> => {
    const response = await apiClient.get<Employee>('/employee/profile');
    return response.data;
  },

  updateProfile: async (data: { name?: string; phone?: string; profilePhoto?: string }): Promise<Employee> => {
    const response = await apiClient.put<Employee>('/employee/profile', data);
    return response.data;
  }
};
