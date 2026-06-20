import request, { PaginatedResponse } from './index'

export interface DictionaryItem {
  id: number
  code: string
  name: string
  value: string
  sort_order: number
  is_default: boolean
  is_active: boolean
}

export interface DictionaryCategory {
  id: number
  code: string
  name: string
  description: string
  item_count: number
  created_at: string
}

export const dictionaryApi = {
  categoryList: (params?: any) =>
    request.get<any, PaginatedResponse<DictionaryCategory>>('/dictionaries/categories/', { params }),

  categoryDetail: (id: number) =>
    request.get<any, any>(`/dictionaries/categories/${id}/`),

  categoryCreate: (data: any) =>
    request.post('/dictionaries/categories/', data),

  categoryUpdate: (id: number, data: any) =>
    request.put(`/dictionaries/categories/${id}/`, data),

  categoryDelete: (id: number) =>
    request.delete(`/dictionaries/categories/${id}/`),

  getByCode: (code: string) =>
    request.get<any, DictionaryItem[]>(`/dictionaries/categories/by-code/${code}/`),

  itemList: (params?: any) =>
    request.get<any, PaginatedResponse<any>>('/dictionaries/items/', { params }),

  itemCreate: (data: any) =>
    request.post('/dictionaries/items/', data),

  itemUpdate: (id: number, data: any) =>
    request.put(`/dictionaries/items/${id}/`, data),

  itemDelete: (id: number) =>
    request.delete(`/dictionaries/items/${id}/`),
}
