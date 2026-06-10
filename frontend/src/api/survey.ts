import request from './request'
import type { HouseSurvey, PaginatedResponse, ApiResponse } from '@/types'

export const getHouseSurveyList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<HouseSurvey>>, ApiResponse<PaginatedResponse<HouseSurvey>>>('/house-surveys', { params })
}

export const getHouseSurveyDetail = (id: string) => {
  return request.get<ApiResponse<HouseSurvey>, ApiResponse<HouseSurvey>>(`/house-surveys/${id}`)
}

export const createHouseSurvey = (data: Partial<HouseSurvey>) => {
  return request.post<ApiResponse<HouseSurvey>, ApiResponse<HouseSurvey>>('/house-surveys', data)
}

export const updateHouseSurvey = (id: string, data: Partial<HouseSurvey>) => {
  return request.patch<ApiResponse<HouseSurvey>, ApiResponse<HouseSurvey>>(`/house-surveys/${id}`, data)
}

export const deleteHouseSurvey = (id: string) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/house-surveys/${id}`)
}

export const getHouseSurveysByProject = (projectId: string) => {
  return request.get<ApiResponse<HouseSurvey[]>, ApiResponse<HouseSurvey[]>>(`/house-surveys/project/${projectId}`)
}
