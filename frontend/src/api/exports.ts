import request from '@/utils/request';

export interface ExportParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  interviewerId?: string;
  keyword?: string;
}

export const exportInterviewDetails = (params: ExportParams): Promise<void> => {
  return request.get('/exports/interview-details', {
    params,
    responseType: 'blob',
  });
};

export const exportAssessmentStats = (params: Omit<ExportParams, 'status' | 'keyword'>): Promise<void> => {
  return request.get('/exports/assessment-stats', {
    params,
    responseType: 'blob',
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
