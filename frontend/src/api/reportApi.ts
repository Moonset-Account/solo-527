import request from '@/utils/request';
import type { DurationReport, ResultReport, TrendReport, ApiResponse } from '@/types';

export const reportApi = {
  getDurationReport: async (startDate: string, endDate: string): Promise<ApiResponse<DurationReport[]>> => {
    return request.get('/reports/duration', { params: { startDate, endDate } });
  },

  getResultReport: async (startDate: string, endDate: string): Promise<ApiResponse<ResultReport[]>> => {
    return request.get('/reports/result', { params: { startDate, endDate } });
  },

  getTrendReport: async (startDate: string, endDate: string): Promise<ApiResponse<TrendReport[]>> => {
    return request.get('/reports/trend', { params: { startDate, endDate } });
  },
};
