import request from './request'
import type { StagePhoto, PaginatedResponse, ApiResponse } from '@/types'

export const getStagePhotoList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<StagePhoto>>, ApiResponse<PaginatedResponse<StagePhoto>>>('/stage-photos', { params })
}

export const getStagePhotoDetail = (id: number) => {
  return request.get<ApiResponse<StagePhoto>, ApiResponse<StagePhoto>>(`/stage-photos/${id}`)
}

export const createStagePhoto = (data: Partial<StagePhoto>) => {
  return request.post<ApiResponse<StagePhoto>, ApiResponse<StagePhoto>>('/stage-photos', data)
}

export const updateStagePhoto = (id: number, data: Partial<StagePhoto>) => {
  return request.patch<ApiResponse<StagePhoto>, ApiResponse<StagePhoto>>(`/stage-photos/${id}`, data)
}

export const deleteStagePhoto = (id: number) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/stage-photos/${id}`)
}

export const getStagePhotosByProject = (projectId: number) => {
  return request.get<ApiResponse<StagePhoto[]>, ApiResponse<StagePhoto[]>>(`/stage-photos/project/${projectId}`)
}
