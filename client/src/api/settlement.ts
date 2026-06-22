import request from './request';
import type { License, PaginatedResponse, DepartmentSummaryData } from '@/types';

export const getRenewalList = (params?: {
  page?: number;
  pageSize?: number;
  department?: string;
  pluginId?: number;
  daysLeft?: number;
}) => {
  return request.get<PaginatedResponse<License>>('/settlement/renewal-list', { params });
};

export const getDepartmentSummary = (params?: {
  period?: string;
  department?: string;
}) => {
  return request.get<DepartmentSummaryData>('/settlement/department-summary', { params });
};
