import request from './request'
import type { AfterSales, PaginatedResponse, ApiResponse } from '@/types'

export const getAfterSalesList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<AfterSales>>, ApiResponse<PaginatedResponse<AfterSales>>>('/after-sales', { params })
}

export const getAfterSalesDetail = (id: string) => {
  return request.get<ApiResponse<AfterSales>, ApiResponse<AfterSales>>(`/after-sales/${id}`)
}

export const createAfterSales = (data: Partial<AfterSales>) => {
  return request.post<ApiResponse<AfterSales>, ApiResponse<AfterSales>>('/after-sales', data)
}

export const updateAfterSales = (id: string, data: Partial<AfterSales>) => {
  return request.patch<ApiResponse<AfterSales>, ApiResponse<AfterSales>>(`/after-sales/${id}`, data)
}

export const deleteAfterSales = (id: string) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/after-sales/${id}`)
}

export const getAfterSalesByProject = (projectId: string) => {
  return request.get<ApiResponse<AfterSales[]>, ApiResponse<AfterSales[]>>(`/after-sales/project/${projectId}`)
}

export const handleAfterSales = (id: string, data: { solution: string; cost?: number; status: string }) => {
  return request.patch<ApiResponse<AfterSales>, ApiResponse<AfterSales>>(`/after-sales/${id}/handle`, data)
}

export const processAfterSales = (id: string, data: { solution: string; cost?: number; handler?: string }) => {
  return request.patch<ApiResponse<AfterSales>, ApiResponse<AfterSales>>(`/after-sales/${id}/process`, data)
}
