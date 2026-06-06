import request from '@/utils/request'
import type { MaterialKit, PaginatedResponse } from '@/types'

export const getMaterials = (params?: any) => {
  return request.get<any, PaginatedResponse<MaterialKit>>('/materials', { params })
}

export const getMaterial = (id: number) => {
  return request.get<any, MaterialKit>(`/materials/${id}`)
}

export const createMaterial = (data: any) => {
  return request.post('/materials', { material_kit: data })
}

export const updateMaterial = (id: number, data: any) => {
  return request.put(`/materials/${id}`, { material_kit: data })
}

export const restockMaterial = (id: number, quantity: number) => {
  return request.put(`/materials/${id}/restock`, null, { params: { quantity } })
}

export const deductStockMaterial = (id: number, quantity: number) => {
  return request.put(`/materials/${id}/deduct_stock`, null, { params: { quantity } })
}
