import { get, post, put, del } from './request';
import type {
  SystemConfig,
  SystemConfigQueryParams,
  ConfigCategory,
  PaginatedResult,
} from '@/types';

const API_PREFIX = '/api/system-config';

export const getConfigs = (params?: SystemConfigQueryParams): Promise<PaginatedResult<SystemConfig>> => {
  return get<PaginatedResult<SystemConfig>>(API_PREFIX, params);
};

export const getConfigsByCategory = (category: ConfigCategory): Promise<SystemConfig[]> => {
  return get<SystemConfig[]>(`${API_PREFIX}/category/${category}`);
};

export const getConfig = (id: string): Promise<SystemConfig> => {
  return get<SystemConfig>(`${API_PREFIX}/${id}`);
};

export const createConfig = (
  data: Partial<SystemConfig>,
  operator?: string
): Promise<SystemConfig> => {
  return post<SystemConfig>(API_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateConfig = (
  id: string,
  data: Partial<SystemConfig>,
  operator?: string
): Promise<SystemConfig> => {
  return put<SystemConfig>(`${API_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteConfig = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${API_PREFIX}/${id}`);
};

export const refreshConfigs = (): Promise<{ success: boolean }> => {
  return post<{ success: boolean }>(`${API_PREFIX}/refresh-cache`);
};
