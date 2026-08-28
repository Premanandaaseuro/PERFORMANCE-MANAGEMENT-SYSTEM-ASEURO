import apiClient from './apiClient';

export const reportApi = {
  downloadReport: async (assignmentId: number, format: 'pdf' | 'excel', filename: string): Promise<void> => {
    const response = await apiClient.get(`/employee/reports/${assignmentId}/download`, {
      params: { format },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
};
