import request from './request'
import type { DesignPlan, PaginatedResponse, ApiResponse } from '@/types'

export const getDesignPlanList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<DesignPlan>>, ApiResponse<PaginatedResponse<DesignPlan>>>('/design-plans', { params })
}

export const getDesignPlanDetail = (id: string) => {
  return request.get<ApiResponse<DesignPlan>, ApiResponse<DesignPlan>>(`/design-plans/${id}`)
}

export const createDesignPlan = (data: Partial<DesignPlan>) => {
  return request.post<ApiResponse<DesignPlan>, ApiResponse<DesignPlan>>('/design-plans', data)
}

export const updateDesignPlan = (id: string, data: Partial<DesignPlan>) => {
  return request.patch<ApiResponse<DesignPlan>, ApiResponse<DesignPlan>>(`/design-plans/${id}`, data)
}

export const deleteDesignPlan = (id: string) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/design-plans/${id}`)
}

export const getDesignPlansByProject = (projectId: string) => {
  return request.get<ApiResponse<DesignPlan[]>, ApiResponse<DesignPlan[]>>(`/design-plans/project/${projectId}`)
}
