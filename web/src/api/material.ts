import { get, post, put, del } from './request';
import type {
  Material,
  MaterialCost,
  MaterialQueryParams,
  MaterialCostQueryParams,
  MaterialCostStats,
  PaginatedResult,
} from '@/types';

const MATERIALS_PREFIX = '/api/materials';
const COSTS_PREFIX = '/api/material-costs';

export const getMaterials = (params?: MaterialQueryParams): Promise<PaginatedResult<Material>> => {
  return get<PaginatedResult<Material>>(MATERIALS_PREFIX, params);
};

export const getLowStockMaterials = (): Promise<Material[]> => {
  return get<Material[]>(`${MATERIALS_PREFIX}/low-stock`);
};

export const getMaterial = (id: string): Promise<Material> => {
  return get<Material>(`${MATERIALS_PREFIX}/${id}`);
};

export const createMaterial = (
  data: Partial<Material>,
  operator?: string
): Promise<Material> => {
  return post<Material>(MATERIALS_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateMaterial = (
  id: string,
  data: Partial<Material>,
  operator?: string
): Promise<Material> => {
  return put<Material>(`${MATERIALS_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteMaterial = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${MATERIALS_PREFIX}/${id}`);
};

export const getMaterialCosts = (params?: MaterialCostQueryParams): Promise<PaginatedResult<MaterialCost>> => {
  return get<PaginatedResult<MaterialCost>>(COSTS_PREFIX, params);
};

export const getCostStats = (
  materialId?: string,
  startDate?: string,
  endDate?: string
): Promise<MaterialCostStats> => {
  return get<MaterialCostStats>(`${COSTS_PREFIX}/stats`, { materialId, startDate, endDate });
};

export const getMaterialCost = (id: string): Promise<MaterialCost> => {
  return get<MaterialCost>(`${COSTS_PREFIX}/${id}`);
};

export const createMaterialCost = (
  data: Partial<MaterialCost>,
  operator?: string
): Promise<MaterialCost> => {
  return post<MaterialCost>(COSTS_PREFIX, data, {
    params: { operator: operator || 'system' },
  });
};

export const updateMaterialCost = (
  id: string,
  data: Partial<MaterialCost>,
  operator?: string
): Promise<MaterialCost> => {
  return put<MaterialCost>(`${COSTS_PREFIX}/${id}`, data, {
    params: { operator: operator || 'system' },
  });
};

export const deleteMaterialCost = (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>(`${COSTS_PREFIX}/${id}`);
};
