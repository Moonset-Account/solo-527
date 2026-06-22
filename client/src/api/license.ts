import request from './request';
import type { License, PaginatedResponse } from '@/types';

export const getLicenseList = (params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  pluginId?: number;
  department?: string;
}) => {
  return request.get<PaginatedResponse<License>>('/licenses', { params });
};

export const getLicenseDetail = (id: number) => {
  return request.get<License>(`/licenses/${id}`);
};
