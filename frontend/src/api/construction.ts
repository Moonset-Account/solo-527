import request from './request'
import type { ConstructionStage, StagePhoto, CustomerFeedback, DelayReminder, PaginatedResponse, ApiResponse } from '@/types'

export const getConstructionStageList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<ConstructionStage>>, ApiResponse<PaginatedResponse<ConstructionStage>>>('/construction-stages', { params })
}

export const getConstructionStageDetail = (id: string) => {
  return request.get<ApiResponse<ConstructionStage>, ApiResponse<ConstructionStage>>(`/construction-stages/${id}`)
}

export const createConstructionStage = (data: Partial<ConstructionStage>) => {
  return request.post<ApiResponse<ConstructionStage>, ApiResponse<ConstructionStage>>('/construction-stages', data)
}

export const updateConstructionStage = (id: string, data: Partial<ConstructionStage>) => {
  return request.patch<ApiResponse<ConstructionStage>, ApiResponse<ConstructionStage>>(`/construction-stages/${id}`, data)
}

export const deleteConstructionStage = (id: string) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/construction-stages/${id}`)
}

export const getConstructionStagesByProject = (projectId: string) => {
  return request.get<ApiResponse<ConstructionStage[]>, ApiResponse<ConstructionStage[]>>(`/construction-stages/project/${projectId}`)
}

export const getStagePhotos = (stageId: string) => {
  return request.get<ApiResponse<StagePhoto[]>, ApiResponse<StagePhoto[]>>(`/construction-stages/${stageId}/photos`)
}

export const uploadStagePhoto = (stageId: string, data: FormData) => {
  return request.post<ApiResponse<StagePhoto>, ApiResponse<StagePhoto>>(`/construction-stages/${stageId}/photos`, data)
}

export const deleteStagePhoto = (photoId: string) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/stage-photos/${photoId}`)
}

export const getCustomerFeedbackList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<CustomerFeedback>>, ApiResponse<PaginatedResponse<CustomerFeedback>>>('/customer-feedbacks', { params })
}

export const getCustomerFeedbacksByProject = (projectId: string) => {
  return request.get<ApiResponse<CustomerFeedback[]>, ApiResponse<CustomerFeedback[]>>(`/customer-feedbacks/project/${projectId}`)
}

export const createCustomerFeedback = (data: Partial<CustomerFeedback>) => {
  return request.post<ApiResponse<CustomerFeedback>, ApiResponse<CustomerFeedback>>('/customer-feedbacks', data)
}

export const replyCustomerFeedback = (id: string, reply: string) => {
  return request.put<ApiResponse<CustomerFeedback>, ApiResponse<CustomerFeedback>>(`/customer-feedbacks/${id}/reply`, { reply })
}

export const getDelayReminderList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<DelayReminder>>, ApiResponse<PaginatedResponse<DelayReminder>>>('/delay-reminders', { params })
}

export const getDelayRemindersByProject = (projectId: string) => {
  return request.get<ApiResponse<DelayReminder[]>, ApiResponse<DelayReminder[]>>(`/delay-reminders/project/${projectId}`)
}

export const resolveDelayReminder = (id: string) => {
  return request.put<ApiResponse<DelayReminder>, ApiResponse<DelayReminder>>(`/delay-reminders/${id}/resolve`)
}
