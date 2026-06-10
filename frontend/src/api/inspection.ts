import request from './request'
import type { InspectionTask, PaginatedResponse, ApiResponse } from '@/types'

export const getInspectionTaskList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<InspectionTask>>, ApiResponse<PaginatedResponse<InspectionTask>>>('/inspection-tasks', { params })
}

export const getInspectionTaskDetail = (id: number) => {
  return request.get<ApiResponse<InspectionTask>, ApiResponse<InspectionTask>>(`/inspection-tasks/${id}`)
}

export const createInspectionTask = (data: Partial<InspectionTask>) => {
  return request.post<ApiResponse<InspectionTask>, ApiResponse<InspectionTask>>('/inspection-tasks', data)
}

export const updateInspectionTask = (id: number, data: Partial<InspectionTask>) => {
  return request.patch<ApiResponse<InspectionTask>, ApiResponse<InspectionTask>>(`/inspection-tasks/${id}`, data)
}

export const deleteInspectionTask = (id: number) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/inspection-tasks/${id}`)
}

export const getInspectionTasksByProject = (projectId: number) => {
  return request.get<ApiResponse<InspectionTask[]>, ApiResponse<InspectionTask[]>>(`/inspection-tasks/project/${projectId}`)
}

export const completeInspection = (id: number, data: { result: string; issues?: string; rectificationDeadline?: string; handler?: string }) => {
  return request.patch<ApiResponse<InspectionTask>, ApiResponse<InspectionTask>>(`/inspection-tasks/${id}/complete`, data)
}
