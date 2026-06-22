import request from './request';
import type { Plugin, PaginatedResponse } from '@/types';

export const getPluginList = (params?: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  status?: string;
}) => {
  return request.get<PaginatedResponse<Plugin>>('/plugins', { params });
};

export const getPluginDetail = (id: number) => {
  return request.get<Plugin>(`/plugins/${id}`);
};
