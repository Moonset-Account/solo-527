import { get, post, put, del } from '@/utils/request'
import type { InspectionTemplate, PagedResponse, PaginationParams } from '@/types'

export const getTemplateList = (params: PaginationParams): Promise<PagedResponse<InspectionTemplate>> => {
  return get<PagedResponse<InspectionTemplate>>('/templates', params)
}

export const getTemplateDetail = (id: number): Promise<InspectionTemplate> => {
  return get<InspectionTemplate>(`/templates/${id}`)
}

export const createTemplate = (
  data: Omit<InspectionTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<InspectionTemplate> => {
  return post<InspectionTemplate>('/templates', data)
}

export const updateTemplate = (
  id: number,
  data: Partial<InspectionTemplate>
): Promise<InspectionTemplate> => {
  return put<InspectionTemplate>(`/templates/${id}`, data)
}

export const deleteTemplate = (id: number): Promise<void> => {
  return del<void>(`/templates/${id}`)
}

export const setDefaultTemplate = (id: number): Promise<void> => {
  return post<void>(`/templates/${id}/set-default`)
}

export const getTemplateCategories = (): Promise<string[]> => {
  return get<string[]>('/templates/categories')
}

export const toggleTemplate = (
  id: number,
  enabled: boolean
): Promise<void> => {
  return post<void>(`/templates/${id}/toggle`, { enabled })
}
