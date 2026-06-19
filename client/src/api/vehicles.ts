import { get, post, put, del } from '@/utils/request'
import type { Vehicle, PagedResponse, PaginationParams } from '@/types'

export const getVehicleList = (params: PaginationParams): Promise<PagedResponse<Vehicle>> => {
  return get<PagedResponse<Vehicle>>('/vehicles', params)
}

export const getVehicleDetail = (id: number): Promise<Vehicle> => {
  return get<Vehicle>(`/vehicles/${id}`)
}

export const createVehicle = (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> => {
  return post<Vehicle>('/vehicles', data)
}

export const updateVehicle = (id: number, data: Partial<Vehicle>): Promise<Vehicle> => {
  return put<Vehicle>(`/vehicles/${id}`, data)
}

export const deleteVehicle = (id: number): Promise<void> => {
  return del<void>(`/vehicles/${id}`)
}

export const importVehicles = (file: File): Promise<{ success: number; failed: number }> => {
  const formData = new FormData()
  formData.append('file', file)
  return post<{ success: number; failed: number }>('/vehicles/import', formData)
}

export const exportVehicles = (params?: Partial<PaginationParams>): Promise<Blob> => {
  return get<Blob>('/vehicles/export', params, { responseType: 'blob' })
}
