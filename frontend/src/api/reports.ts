import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export function getReports(params: any) {
  return request.get<PageResult>('/reports', { params })
}

export function getReport(id: string) {
  return request.get(`/reports/${id}`)
}

export function createReport(data: any) {
  return request.post('/reports', data)
}

export function updateReport(id: string, data: any) {
  return request.patch(`/reports/${id}`, data)
}

export function publishReport(id: string) {
  return request.patch(`/reports/${id}/publish`)
}

export function deleteReport(id: string) {
  return request.delete(`/reports/${id}`)
}

export function getLatestReport(type: 'weekly' | 'monthly') {
  return request.get(`/reports/latest/${type}`)
}
