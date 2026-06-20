import request from './request'

export interface Refund {
  _id: string
  registrationId: string
  activityId: string
  userId: string
  userName: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  reviewedBy?: string
  reviewedAt?: string
  processedAt?: string
  createdAt: string
  updatedAt: string
}

export interface RefundListParams {
  activityId?: string
  status?: string
  userId?: string
  page?: number
  limit?: number
}

export interface CreateRefundData {
  registrationId: string
  activityId: string
  userId: string
  userName: string
  amount: number
  reason: string
}

export interface UpdateRefundData {
  status?: string
  reviewedBy?: string
}

export const getRefunds = (params?: RefundListParams) => {
  return request.get('/refunds', { params })
}

export const createRefund = (data: CreateRefundData) => {
  return request.post('/refunds', data)
}

export const updateRefund = (id: string, data: UpdateRefundData) => {
  return request.patch(`/refunds/${id}`, data)
}
