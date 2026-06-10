import { get, post, put, del } from './request';
import type {
  QualityInspection,
  QualityQueryParams,
  QualityStatisticsResult,
  PaginatedResult,
} from '@/types';

const API_PREFIX = '/api/quality/inspections';

export const getInspections = (params?: QualityQueryParams): Promise<PaginatedResult<QualityInspection>> => {
  return get<PaginatedResult<QualityInspection>>(API_PREFIX, params);
};

export const getInspectionsByOrder = (orderId: string): Promise<QualityInspection[]> => {
  return get<QualityInspection[]>(`${API_PREFIX}/order/${orderId}`);
};

export const getQualityStatistics = (params?: Record<string, any>): Promise<QualityStatisticsResult> => {
  return get<QualityStatisticsResult>(`${API_PREFIX}/statistics`, params);
};

export const getInspection = (id: string): Promise<QualityInspection> => {
  return get<QualityInspection>(`${API_PREFIX}/${id}`);
};

export const createInspection = (
  data: Partial<QualityInspection>,
  operator?: string
): Promise<QualityInspection> => {
  return post<QualityInspection>(API_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateInspection = (
  id: string,
  data: Partial<QualityInspection>,
  operator?: string
): Promise<QualityInspection> => {
  return put<QualityInspection>(`${API_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteInspection = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${API_PREFIX}/${id}`);
};
