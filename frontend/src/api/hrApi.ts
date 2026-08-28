import apiClient from './apiClient';
import {
  HrDashboardStats,
  Designation,
  ManagerOption,
  EmployeeRecord,
  CreateEmployeePayload,
  CreateManagerPayload,
  KpiMasterItem,
  EmployeeLifecycleData,
  HrReportSummary,
  Employee
} from '../types';

export const hrApi = {
  getDashboardStats: async (): Promise<HrDashboardStats> => {
    const response = await apiClient.get<HrDashboardStats>('/api/hr/dashboard');
    return response.data;
  },

  getDesignations: async (): Promise<Designation[]> => {
    const response = await apiClient.get<Designation[]>('/api/hr/designations');
    return response.data;
  },

  getManagers: async (): Promise<ManagerOption[]> => {
    const response = await apiClient.get<ManagerOption[]>('/api/hr/managers');
    return response.data;
  },

  createManager: async (data: CreateManagerPayload): Promise<{ message: string; id: number }> => {
    const response = await apiClient.post<{ message: string; id: number }>('/api/hr/managers', data);
    return response.data;
  },

  getEmployees: async (): Promise<EmployeeRecord[]> => {
    const response = await apiClient.get<EmployeeRecord[]>('/api/hr/employees');
    return response.data;
  },

  createEmployee: async (data: CreateEmployeePayload): Promise<{ message: string; id: number; assignedKpisCount: number }> => {
    const response = await apiClient.post<{ message: string; id: number; assignedKpisCount: number }>('/api/hr/employees', data);
    return response.data;
  },

  getKpiMasterList: async (designation?: string): Promise<KpiMasterItem[]> => {
    const response = await apiClient.get<KpiMasterItem[]>('/api/hr/kpis', {
      params: designation ? { designation } : {}
    });
    return response.data;
  },

  createKpi: async (data: { designation: string; kpiName: string; description: string; weightage: number }): Promise<KpiMasterItem> => {
    const response = await apiClient.post<KpiMasterItem>('/api/hr/kpis', data);
    return response.data;
  },

  updateKpi: async (id: number, data: { kpiName: string; description: string; weightage: number; status?: string }): Promise<KpiMasterItem> => {
    const response = await apiClient.put<KpiMasterItem>(`/api/hr/kpis/${id}`, data);
    return response.data;
  },

  deleteKpi: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/hr/kpis/${id}`);
  },

  searchLifecycleEmployees: async (query?: string): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/api/hr/lifecycle/employees', {
      params: query ? { query } : {}
    });
    return response.data;
  },

  getLifecycleDetail: async (employeeId: number): Promise<EmployeeLifecycleData> => {
    const response = await apiClient.get<EmployeeLifecycleData>(`/api/hr/lifecycle/${employeeId}`);
    return response.data;
  },

  finalizePms: async (
    assignmentId: number,
    data: {
      overallScore?: number;
      performanceGrade?: string;
      hrComments?: string;
      kpiRatings?: Array<{ kpiId: number; hrRating?: number; managerRating?: number }>;
    }
  ): Promise<{ message: string; finalScore: number; grade: string }> => {
    const response = await apiClient.post<{ message: string; finalScore: number; grade: string }>(`/api/hr/lifecycle/${assignmentId}/finalize`, data);
    return response.data;
  },

  getReportsSummary: async (): Promise<HrReportSummary> => {
    const response = await apiClient.get<HrReportSummary>('/api/hr/reports/summary');
    return response.data;
  },

  downloadReport: async (assignmentId: number, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> => {
    const response = await apiClient.get('/api/hr/reports/download', {
      params: { assignmentId, format },
      responseType: 'blob'
    });
    return response.data;
  }
};
