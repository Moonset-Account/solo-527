import request from './request';
import type { License, PaginatedResponse, TrialHandleRecord } from '@/types';

export const getTrialList = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  department?: string;
  pluginId?: number;
  keyword?: string;
}) => {
  return request.get<PaginatedResponse<License>>('/trials', { params });
};

export const handleTrial = (id: number, data: {
  result: string;
  remark?: string;
  extendDays?: number;
  planId?: number;
}) => {
  return request.put<TrialHandleRecord>(`/trials/${id}/handle`, data);
};
