import request from './request'
import type { Customer, PaginatedResponse, ApiResponse } from '@/types'

export const getCustomerList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<Customer>>, ApiResponse<PaginatedResponse<Customer>>>('/customers', { params })
}

export const getCustomerDetail = (id: string) => {
  return request.get<ApiResponse<Customer>, ApiResponse<Customer>>(`/customers/${id}`)
}

export const createCustomer = (data: Partial<Customer>) => {
  return request.post<ApiResponse<Customer>, ApiResponse<Customer>>('/customers', data)
}

export const updateCustomer = (id: string, data: Partial<Customer>) => {
  return request.put<ApiResponse<Customer>, ApiResponse<Customer>>(`/customers/${id}`, data)
}

export const deleteCustomer = (id: string) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/customers/${id}`)
}

export const getAllCustomers = () => {
  return request.get<ApiResponse<Customer[]>, ApiResponse<Customer[]>>('/customers/all')
}
