import request from '@/utils/request'
import type { Enrollment, PaginatedResponse } from '@/types'

export const getEnrollments = (params?: any) => {
  return request.get<any, PaginatedResponse<Enrollment>>('/enrollments', { params })
}

export const getMyEnrollments = (params?: any) => {
  return request.get<any, PaginatedResponse<Enrollment>>('/enrollments/my', { params })
}

export const getEnrollment = (id: number) => {
  return request.get<any, Enrollment>(`/enrollments/${id}`)
}

export const createEnrollment = (data: any) => {
  return request.post('/enrollments', data)
}

export const payEnrollment = (id: number, paymentMethod?: string) => {
  return request.put(`/enrollments/${id}/pay`, { payment_method: paymentMethod || 'online' })
}

export const cancelEnrollment = (id: number) => {
  return request.put(`/enrollments/${id}/cancel`)
}

export const requestRefund = (id: number, refundReason?: string) => {
  return request.put(`/enrollments/${id}/request_refund`, { refund_reason: refundReason })
}

export const approveRefund = (id: number) => {
  return request.put(`/enrollments/${id}/approve_refund`)
}

export const rejectRefund = (id: number, rejectReason?: string) => {
  return request.put(`/enrollments/${id}/reject_refund`, { reject_reason: rejectReason })
}

export const completeEnrollment = (id: number) => {
  return request.put(`/enrollments/${id}/complete`)
}

export const updateEnrollment = (id: number, data: any) => {
  return request.put(`/enrollments/${id}/update_status`, data)
}
