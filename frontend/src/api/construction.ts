import request from './request'
import type { ConstructionStage, PaginatedResponse, ApiResponse } from '@/types'

export const getConstructionStageList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<ConstructionStage>>, ApiResponse<PaginatedResponse<ConstructionStage>>>('/construction-stages', { params })
}

export const getConstructionStageDetail = (id: number) => {
  return request.get<ApiResponse<ConstructionStage>, ApiResponse<ConstructionStage>>(`/construction-stages/${id}`)
}

export const createConstructionStage = (data: Partial<ConstructionStage>) => {
  return request.post<ApiResponse<ConstructionStage>, ApiResponse<ConstructionStage>>('/construction-stages', data)
}

export const updateConstructionStage = (id: number, data: Partial<ConstructionStage>) => {
  return request.patch<ApiResponse<ConstructionStage>, ApiResponse<ConstructionStage>>(`/construction-stages/${id}`, data)
}

export const deleteConstructionStage = (id: number) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/construction-stages/${id}`)
}

export const getConstructionStagesByProject = (projectId: number) => {
  return request.get<ApiResponse<ConstructionStage[]>, ApiResponse<ConstructionStage[]>>(`/construction-stages/project/${projectId}`)
}
