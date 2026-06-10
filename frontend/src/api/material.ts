import request from './request'
import type { MaterialCost, PaginatedResponse, ApiResponse } from '@/types'

export const getMaterialCostList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<MaterialCost>>, ApiResponse<PaginatedResponse<MaterialCost>>>('/material-costs', { params })
}

export const getMaterialCostDetail = (id: number) => {
  return request.get<ApiResponse<MaterialCost>, ApiResponse<MaterialCost>>(`/material-costs/${id}`)
}

export const createMaterialCost = (data: Partial<MaterialCost>) => {
  return request.post<ApiResponse<MaterialCost>, ApiResponse<MaterialCost>>('/material-costs', data)
}

export const updateMaterialCost = (id: number, data: Partial<MaterialCost>) => {
  return request.patch<ApiResponse<MaterialCost>, ApiResponse<MaterialCost>>(`/material-costs/${id}`, data)
}

export const deleteMaterialCost = (id: number) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/material-costs/${id}`)
}

export const getMaterialCostsByProject = (projectId: number) => {
  return request.get<ApiResponse<MaterialCost[]>, ApiResponse<MaterialCost[]>>(`/material-costs/project/${projectId}`)
}
