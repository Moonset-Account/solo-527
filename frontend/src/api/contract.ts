import request from './request'
import type { Contract, PaginatedResponse, ApiResponse } from '@/types'

export const getContractList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<Contract>>, ApiResponse<PaginatedResponse<Contract>>>('/contracts', { params })
}

export const getContractDetail = (id: string) => {
  return request.get<ApiResponse<Contract>, ApiResponse<Contract>>(`/contracts/${id}`)
}

export const createContract = (data: Partial<Contract>) => {
  return request.post<ApiResponse<Contract>, ApiResponse<Contract>>('/contracts', data)
}

export const updateContract = (id: string, data: Partial<Contract>) => {
  return request.patch<ApiResponse<Contract>, ApiResponse<Contract>>(`/contracts/${id}`, data)
}

export const deleteContract = (id: string) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/contracts/${id}`)
}

export const getContractsByProject = (projectId: string) => {
  return request.get<ApiResponse<Contract[]>, ApiResponse<Contract[]>>(`/contracts/project/${projectId}`)
}
