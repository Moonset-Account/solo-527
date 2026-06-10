import request from './request'

export const getExceptionList = (params?: any) =>
  request.get<any, any>('/exceptions', { params })

export const getExceptionPendingCount = () =>
  request.get<any, any>('/exceptions/pending-count')

export const getExceptionDetail = (id: number | string) =>
  request.get<any, any>(`/exceptions/${id}`)

export const createException = (data: any) =>
  request.post<any, any>('/exceptions', data)

export const updateException = (id: number | string, data: any) =>
  request.put<any, any>(`/exceptions/${id}`, data)

export const handleException = (id: number | string, data: any) =>
  request.patch<any, any>(`/exceptions/${id}/handle`, data)

export const deleteException = (id: number | string) =>
  request.delete<any, any>(`/exceptions/${id}`)
