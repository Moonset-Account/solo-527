import request from './request'
import type { CustomerFeedback, PaginatedResponse, ApiResponse } from '@/types'

export const getFeedbackList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<CustomerFeedback>>, ApiResponse<PaginatedResponse<CustomerFeedback>>>('/customer-feedbacks', { params })
}

export const getFeedbackDetail = (id: string) => {
  return request.get<ApiResponse<CustomerFeedback>, ApiResponse<CustomerFeedback>>(`/customer-feedbacks/${id}`)
}

export const createFeedback = (data: Partial<CustomerFeedback>) => {
  return request.post<ApiResponse<CustomerFeedback>, ApiResponse<CustomerFeedback>>('/customer-feedbacks', data)
}

export const updateFeedback = (id: string, data: Partial<CustomerFeedback>) => {
  return request.patch<ApiResponse<CustomerFeedback>, ApiResponse<CustomerFeedback>>(`/customer-feedbacks/${id}`, data)
}

export const deleteFeedback = (id: string) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/customer-feedbacks/${id}`)
}

export const getFeedbacksByProject = (projectId: string) => {
  return request.get<ApiResponse<CustomerFeedback[]>, ApiResponse<CustomerFeedback[]>>(`/customer-feedbacks/project/${projectId}`)
}

export const replyFeedback = (id: string, data: { reply: string; handler?: string }) => {
  return request.patch<ApiResponse<CustomerFeedback>, ApiResponse<CustomerFeedback>>(`/customer-feedbacks/${id}/reply`, data)
}
