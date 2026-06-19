import { get, post, put, del } from '@/utils/request'
import type { Part, PagedResponse, PaginationParams } from '@/types'

export const getPartList = (params: PaginationParams): Promise<PagedResponse<Part>> => {
  return get<PagedResponse<Part>>('/parts', params)
}

export const getPartDetail = (id: number): Promise<Part> => {
  return get<Part>(`/parts/${id}`)
}

export const createPart = (data: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>): Promise<Part> => {
  return post<Part>('/parts', data)
}

export const updatePart = (id: number, data: Partial<Part>): Promise<Part> => {
  return put<Part>(`/parts/${id}`, data)
}

export const deletePart = (id: number): Promise<void> => {
  return del<void>(`/parts/${id}`)
}

export const updateStock = (id: number, data: { stock: number }): Promise<void> => {
  return post<void>(`/parts/${id}/stock`, data)
}
