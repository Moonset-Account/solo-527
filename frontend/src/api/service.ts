import request from './request'

export const getServiceList = (params?: { active?: string }) =>
  request.get<any, any>('/services', { params })

export const getServiceDetail = (id: number | string) =>
  request.get<any, any>(`/services/${id}`)

export const createService = (data: any) =>
  request.post<any, any>('/services', data)

export const updateService = (id: number | string, data: any) =>
  request.put<any, any>(`/services/${id}`, data)

export const deleteService = (id: number | string) =>
  request.delete<any, any>(`/services/${id}`)
