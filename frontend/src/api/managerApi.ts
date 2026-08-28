import apiClient from './apiClient';
import {
  ManagerDashboardData,
  ManagerEmployeeItem,
  ManagerEmployeeReviewData,
  ManagerReviewPayload,
  ManagerReportData
} from '../types';

export const managerApi = {
  getDashboard: async (): Promise<ManagerDashboardData> => {
    const response = await apiClient.get<ManagerDashboardData>('/api/manager/dashboard');
    return response.data;
  },

  getAssignedEmployees: async (): Promise<ManagerEmployeeItem[]> => {
    const response = await apiClient.get<ManagerEmployeeItem[]>('/api/manager/employees');
    return response.data;
  },

  getEmployeeKpiReview: async (employeeId: number): Promise<ManagerEmployeeReviewData> => {
    const response = await apiClient.get<ManagerEmployeeReviewData>(`/api/manager/employees/${employeeId}/pms`);
    return response.data;
  },

  submitManagerReview: async (assignmentId: number, data: ManagerReviewPayload): Promise<{ message: string; assignmentId: number; status: string }> => {
    const response = await apiClient.post<{ message: string; assignmentId: number; status: string }>(`/api/manager/pms/${assignmentId}/submit`, data);
    return response.data;
  },

  getReports: async (): Promise<ManagerReportData> => {
    const response = await apiClient.get<ManagerReportData>('/api/manager/reports');
    return response.data;
  },

  downloadReport: async (assignmentId: number, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> => {
    const response = await apiClient.get('/api/manager/reports/download', {
      params: { assignmentId, format },
      responseType: 'blob'
    });
    return response.data;
  }
};
