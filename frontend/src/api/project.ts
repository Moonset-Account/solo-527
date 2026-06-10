import request from './request'
import type { Project, PaginatedResponse, ApiResponse, ProcessRecord } from '@/types'

export const getProjectList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<Project>>, ApiResponse<PaginatedResponse<Project>>>('/projects', { params })
}

export const getProjectDetail = (id: string) => {
  return request.get<ApiResponse<Project>, ApiResponse<Project>>(`/projects/${id}`)
}

export const createProject = (data: Partial<Project>) => {
  return request.post<ApiResponse<Project>, ApiResponse<Project>>('/projects', data)
}

export const updateProject = (id: string, data: Partial<Project>) => {
  return request.patch<ApiResponse<Project>, ApiResponse<Project>>(`/projects/${id}`, data)
}

export const deleteProject = (id: string) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/projects/${id}`)
}

export const getProcessRecords = (projectId: string) => {
  return request.get<ApiResponse<ProcessRecord[]>, ApiResponse<ProcessRecord[]>>(`/projects/${projectId}/process-records`)
}
