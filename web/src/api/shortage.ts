import { get, post, put, del } from './request';
import type {
  MaterialShortage,
  ShortageQueryParams,
  ShortageStatistics,
  PaginatedResult,
} from '@/types';

const API_PREFIX = '/api/shortages';

export const getShortages = (params?: ShortageQueryParams): Promise<PaginatedResult<MaterialShortage>> => {
  return get<PaginatedResult<MaterialShortage>>(API_PREFIX, params);
};

export const getShortageStatistics = (): Promise<ShortageStatistics> => {
  return get<ShortageStatistics>(`${API_PREFIX}/statistics`);
};

export const getShortage = (id: string): Promise<MaterialShortage> => {
  return get<MaterialShortage>(`${API_PREFIX}/${id}`);
};

export const createShortage = (
  data: Partial<MaterialShortage>,
  operator?: string
): Promise<MaterialShortage> => {
  return post<MaterialShortage>(API_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateShortage = (
  id: string,
  data: Partial<MaterialShortage>,
  operator?: string
): Promise<MaterialShortage> => {
  return put<MaterialShortage>(`${API_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteShortage = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${API_PREFIX}/${id}`);
};

export const startProcessing = (id: string, operator?: string): Promise<MaterialShortage> => {
  return post<MaterialShortage>(`${API_PREFIX}/${id}/start-processing`, undefined, {
    params: { operator: operator || 'system' },
  });
};

export const resolveShortage = (
  id: string,
  data: { resolutionResult: string },
  operator?: string
): Promise<MaterialShortage> => {
  return post<MaterialShortage>(`${API_PREFIX}/${id}/resolve`, data, {
    params: { operator: operator || 'system' },
  });
};

export const closeShortage = (id: string, operator?: string): Promise<MaterialShortage> => {
  return post<MaterialShortage>(`${API_PREFIX}/${id}/close`, undefined, {
    params: { operator: operator || 'system' },
  });
};
