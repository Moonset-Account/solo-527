import request from './request'
import type { CustomerFeedback, PaginatedResponse, ApiResponse } from '@/types'

export const getCustomerFeedbackList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<CustomerFeedback>>, ApiResponse<PaginatedResponse<CustomerFeedback>>>('/customer-feedbacks', { params })
}

export const getCustomerFeedbackDetail = (id: number) => {
  return request.get<ApiResponse<CustomerFeedback>, ApiResponse<CustomerFeedback>>(`/customer-feedbacks/${id}`)
}

export const createCustomerFeedback = (data: Partial<CustomerFeedback>) => {
  return request.post<ApiResponse<CustomerFeedback>, ApiResponse<CustomerFeedback>>('/customer-feedbacks', data)
}

export const updateCustomerFeedback = (id: number, data: Partial<CustomerFeedback>) => {
  return request.patch<ApiResponse<CustomerFeedback>, ApiResponse<CustomerFeedback>>(`/customer-feedbacks/${id}`, data)
}

export const deleteCustomerFeedback = (id: number) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/customer-feedbacks/${id}`)
}

export const getCustomerFeedbacksByProject = (projectId: number) => {
  return request.get<ApiResponse<CustomerFeedback[]>, ApiResponse<CustomerFeedback[]>>(`/customer-feedbacks/project/${projectId}`)
}

export const replyCustomerFeedback = (id: number, data: { reply: string; handler?: string }) => {
  return request.patch<ApiResponse<CustomerFeedback>, ApiResponse<CustomerFeedback>>(`/customer-feedbacks/${id}/reply`, data)
}
