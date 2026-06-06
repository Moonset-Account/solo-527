import request from '@/utils/request'
import type { Work, PaginatedResponse } from '@/types'

export const getWorks = (params?: any) => {
  return request.get<any, PaginatedResponse<Work>>('/works', { params })
}

export const getMyWorks = (params?: any) => {
  return request.get<any, PaginatedResponse<Work>>('/works/my', { params })
}

export const getWork = (id: number) => {
  return request.get<any, Work>(`/works/${id}`)
}

export const createWork = (data: any) => {
  return request.post('/works', { work: data })
}

export const updateWork = (id: number, data: any) => {
  return request.put(`/works/${id}`, { work: data })
}

export const authorizeWorkPublic = (id: number) => {
  return request.put(`/works/${id}/authorize_public`)
}

export const approveWork = (id: number) => {
  return request.put(`/works/${id}/approve`)
}

export const rejectWork = (id: number, rejectReason?: string) => {
  return request.put(`/works/${id}/reject`, { reject_reason: rejectReason })
}
