import { get, post, put, del } from '@/utils/request'

export interface ServiceItem {
  _id: string
  name: string
  category: string
  duration: number
  price: number
  unit: string
  description: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceListResult {
  data: ServiceItem[]
  total: number
  page: number
  pageSize: number
}

export interface CreateServiceParams {
  name: string
  category: string
  duration: number
  price: number
  unit: string
  description?: string
  enabled?: boolean
}

export interface UpdateServiceParams {
  name?: string
  category?: string
  duration?: number
  price?: number
  unit?: string
  description?: string
  enabled?: boolean
}

export interface QueryServiceParams {
  category?: string
  enabled?: boolean
  keyword?: string
  page?: number
  pageSize?: number
}

export function createService(params: CreateServiceParams) {
  return post<ServiceItem>('/services', params)
}

export function getServiceList(params?: QueryServiceParams) {
  return get<ServiceListResult>('/services', params)
}

export function getServiceByCategory(category: string) {
  return get<ServiceItem[]>(`/services/category/${category}`)
}

export function getServiceById(id: string) {
  return get<ServiceItem>(`/services/${id}`)
}

export function updateService(id: string, params: UpdateServiceParams) {
  return put<ServiceItem>(`/services/${id}`, params)
}

export function deleteService(id: string) {
  return del<void>(`/services/${id}`)
}

export function enableService(id: string) {
  return post<ServiceItem>(`/services/${id}/enable`)
}

export function disableService(id: string) {
  return post<ServiceItem>(`/services/${id}/disable`)
}
