import request from './request'
import type { AfterSales, PaginatedResponse, ApiResponse } from '@/types'

export const getAfterSalesList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<AfterSales>>, ApiResponse<PaginatedResponse<AfterSales>>>('/after-sales', { params })
}

export const getAfterSalesDetail = (id: number) => {
  return request.get<ApiResponse<AfterSales>, ApiResponse<AfterSales>>(`/after-sales/${id}`)
}

export const createAfterSales = (data: Partial<AfterSales>) => {
  return request.post<ApiResponse<AfterSales>, ApiResponse<AfterSales>>('/after-sales', data)
}

export const updateAfterSales = (id: number, data: Partial<AfterSales>) => {
  return request.patch<ApiResponse<AfterSales>, ApiResponse<AfterSales>>(`/after-sales/${id}`, data)
}

export const deleteAfterSales = (id: number) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/after-sales/${id}`)
}

export const getAfterSalesByProject = (projectId: number) => {
  return request.get<ApiResponse<AfterSales[]>, ApiResponse<AfterSales[]>>(`/after-sales/project/${projectId}`)
}

export const processAfterSales = (id: number, data: { solution: string; cost?: number | string; handler?: string }) => {
  return request.patch<ApiResponse<AfterSales>, ApiResponse<AfterSales>>(`/after-sales/${id}/process`, data)
}
