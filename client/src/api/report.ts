import request from './request';
import type { UsageTrendData, SeatUtilizationData } from '@/types';

export const getUsageTrend = (params?: {
  pluginId?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
}) => {
  return request.get<UsageTrendData>('/reports/usage-trend', { params });
};

export const getSeatUtilization = (params?: {
  department?: string;
  pluginId?: number;
}) => {
  return request.get<SeatUtilizationData>('/reports/seat-utilization', { params });
};
