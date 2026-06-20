import request from './request'

export interface Refund {
  _id: string
  activityId: string
  activityTitle: string
  userId: string
  userName: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  processNote?: string
  createdAt: string
  updatedAt: string
}

export interface RefundListParams {
  status?: string
  page?: number
  pageSize?: number
}

export const getRefunds = (params?: RefundListParams) => {
  return request.get('/refunds', { params })
}

export const createRefund = (data: Partial<Refund>) => {
  return request.post('/refunds', data)
}

export const updateRefund = (id: string, data: Partial<Refund>) => {
  return request.put(`/refunds/${id}`, data)
}
