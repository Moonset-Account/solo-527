import request from '@/utils/request'
import type { TourOrder, RefundRecord, PageResult, Result } from '@/types'

export const getOrderList = (params: {
  page?: number
  size?: number
  orderNo?: string
  routeId?: number
  customerName?: string
  customerPhone?: string
  startDate?: string
  endDate?: string
  orderStatus?: string
  refundStatus?: string
}) => {
  return request.get<Result<PageResult<TourOrder>>>('/admin/orders', { params })
}

export const getOrderById = (id: number) => {
  return request.get<Result<TourOrder>>(`/admin/orders/${id}`)
}

export const getOrderByNo = (orderNo: string) => {
  return request.get<Result<TourOrder>>(`/admin/orders/no/${orderNo}`)
}

export const createOrder = (data: TourOrder) => {
  return request.post<Result<TourOrder>>('/admin/orders', data)
}

export const updateOrder = (data: TourOrder) => {
  return request.put<Result<TourOrder>>('/admin/orders', data)
}

export const updateOrderStatus = (id: number, status: string) => {
  return request.put<Result<TourOrder>>(`/admin/orders/${id}/status`, null, {
    params: { status },
  })
}

export const deleteOrder = (id: number) => {
  return request.delete<Result<void>>(`/admin/orders/${id}`)
}

export const getRefundList = (params: {
  page?: number
  size?: number
  refundNo?: string
  orderNo?: string
  routeId?: number
  refundStatus?: string
  refundType?: string
}) => {
  return request.get<Result<PageResult<RefundRecord>>>('/admin/refunds', { params })
}

export const getRefundById = (id: number) => {
  return request.get<Result<RefundRecord>>(`/admin/refunds/${id}`)
}

export const getRefundByNo = (refundNo: string) => {
  return request.get<Result<RefundRecord>>(`/admin/refunds/no/${refundNo}`)
}

export const applyRefund = (params: {
  orderNo: string
  refundAmount: number
  refundReason: string
  refundType?: string
}) => {
  return request.post<Result<RefundRecord>>('/admin/refunds/apply', null, { params })
}

export const approveRefund = (id: number) => {
  return request.post<Result<RefundRecord>>(`/admin/refunds/${id}/approve`)
}

export const rejectRefund = (id: number, rejectReason: string) => {
  return request.post<Result<RefundRecord>>(`/admin/refunds/${id}/reject`, null, {
    params: { rejectReason },
  })
}

export const deleteRefund = (id: number) => {
  return request.delete<Result<void>>(`/admin/refunds/${id}`)
}
