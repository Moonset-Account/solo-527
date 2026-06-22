import request from './request';
import type { Application, PaginatedResponse } from '@/types';

export const createApplication = (data: {
  pluginId: number;
  planId: number;
  reason: string;
  seatCount?: number;
  trialDays?: number;
}) => {
  return request.post<Application>('/applications', data);
};

export const getApplicationList = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  pluginId?: number;
  department?: string;
  keyword?: string;
}) => {
  return request.get<PaginatedResponse<Application>>('/applications', { params });
};

export const getApplicationDetail = (id: number) => {
  return request.get<Application>(`/applications/${id}`);
};

export const updateApplicationStatus = (id: number, data: {
  status: string;
  processingNote?: string;
  closeReason?: string;
  trialDays?: number;
}) => {
  return request.put<Application>(`/applications/${id}/status`, data);
};
