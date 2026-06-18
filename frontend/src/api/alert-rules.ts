import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export function getAlertRules(params?: any) {
  return request.get<any, PageResult>('/alert-rules', { params })
}

export function getAlertRule(id: string) {
  return request.get(`/alert-rules/${id}`)
}

export function createAlertRule(data: any) {
  return request.post('/alert-rules', data)
}

export function updateAlertRule(id: string, data: any) {
  return request.patch(`/alert-rules/${id}`, data)
}

export function toggleAlertRule(id: string) {
  return request.patch(`/alert-rules/${id}/toggle`)
}

export function deleteAlertRule(id: string) {
  return request.delete(`/alert-rules/${id}`)
}
