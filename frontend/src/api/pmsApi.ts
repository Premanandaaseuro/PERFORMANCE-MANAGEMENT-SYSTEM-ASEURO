import apiClient from './apiClient';
import { DashboardData, PmsAssignment, PmsHistory } from '../types';

export interface KpiRatingEntry {
  kpiId: number;
  selfRating: number | null;
  comments: string;
}

export interface KpiRatingRequest {
  ratings: KpiRatingEntry[];
}

export const pmsApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get<DashboardData>('/employee/pms/dashboard');
    return response.data;
  },
  getCurrentAssignment: async (): Promise<PmsAssignment> => {
    const response = await apiClient.get<PmsAssignment>('/employee/pms/current');
    return response.data;
  },
  getAssignmentDetail: async (assignmentId: number): Promise<PmsAssignment> => {
    const response = await apiClient.get<PmsAssignment>(`/employee/pms/${assignmentId}`);
    return response.data;
  },
  saveDraft: async (assignmentId: number, data: KpiRatingRequest): Promise<PmsAssignment> => {
    const response = await apiClient.put<PmsAssignment>(`/employee/pms/${assignmentId}/draft`, data);
    return response.data;
  },
  submitAssessment: async (assignmentId: number, data: KpiRatingRequest): Promise<PmsAssignment> => {
    const response = await apiClient.post<PmsAssignment>(`/employee/pms/${assignmentId}/submit`, data);
    return response.data;
  },
  getHistory: async (): Promise<PmsHistory[]> => {
    const response = await apiClient.get<PmsHistory[]>('/employee/pms/history');
    return response.data;
  },
  resetActiveCycle: async (): Promise<void> => {
    await apiClient.post('/employee/pms/reset-active');
  }
};
