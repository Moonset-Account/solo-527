import request from '@/utils/request';

export interface ExportParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  ownerId?: string;
  keyword?: string;
}

function extractFilename(contentDisposition: string): string {
  if (!contentDisposition) return '';
  const matches = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (matches && matches[1]) {
    try {
      return decodeURIComponent(matches[1]);
    } catch (e) {
      return matches[1];
    }
  }
  const fallback = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return fallback ? fallback[1] : '';
}

function getHeader(response: any, name: string): string {
  if (!response || !response.headers) return '';
  const headers = response.headers;
  if (typeof headers.get === 'function') {
    return headers.get(name) || '';
  }
  return headers[name] || headers[name.toLowerCase()] || '';
}

export const exportInterviewDetails = async (params: ExportParams): Promise<void> => {
  const queryParams: any = {
    startDate: params.startDate,
    endDate: params.endDate,
    status: params.status,
    interviewerId: params.ownerId,
    keyword: params.keyword,
  };
  const response: any = await request.get('/exports/interview-details', {
    params: queryParams,
    responseType: 'blob',
  });
  const contentDisposition = getHeader(response, 'content-disposition');
  const filename = extractFilename(contentDisposition)
    || `面试明细报表_${new Date().toISOString().split('T')[0]}.xlsx`;
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  downloadBlob(blob, filename);
};

export const exportAssessmentStats = async (params: Omit<ExportParams, 'status' | 'keyword'>): Promise<void> => {
  const queryParams: any = {
    startDate: params.startDate,
    endDate: params.endDate,
    interviewerId: params.ownerId,
  };
  const response: any = await request.get('/exports/assessment-stats', {
    params: queryParams,
    responseType: 'blob',
  });
  const contentDisposition = getHeader(response, 'content-disposition');
  const filename = extractFilename(contentDisposition)
    || `面试质量分析_${new Date().toISOString().split('T')[0]}.xlsx`;
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  downloadBlob(blob, filename);
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
