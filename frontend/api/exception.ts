import request from './request'
import type { ApiResponse, PageResult, ExceptionOrder } from '~/types'

export interface ExceptionOrderQuery {
  page?: number
  page_size?: number
  keyword?: string
  exception_type?: string
  status?: string
  priority?: string
  assigned_to?: number
  lease_id?: number
}

export function getExceptionOrderList(params: ExceptionOrderQuery): Promise<ApiResponse<PageResult<ExceptionOrder>>> {
  return request.get('/exception-orders', { params })
}

export function getExceptionOrderDetail(id: number): Promise<ApiResponse<ExceptionOrder>> {
  return request.get(`/exception-orders/${id}`)
}

export function createExceptionOrder(data: Partial<ExceptionOrder>): Promise<ApiResponse<ExceptionOrder>> {
  return request.post('/exception-orders', data)
}

export function updateExceptionOrder(id: number, data: Partial<ExceptionOrder>): Promise<ApiResponse<ExceptionOrder>> {
  return request.put(`/exception-orders/${id}`, data)
}

export function resolveExceptionOrder(id: number, data: { resolution: string }): Promise<ApiResponse<ExceptionOrder>> {
  return request.post(`/exception-orders/${id}/resolve`, data)
}

export function deleteExceptionOrder(id: number): Promise<ApiResponse> {
  return request.delete(`/exception-orders/${id}`)
}
