import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export interface QueryAnomaliesParams {
  keyword?: string
  category?: string
  severity?: string
  status?: string
  assigneeId?: string
  datasetId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export function getAnomalies(params: QueryAnomaliesParams) {
  return request.get<any, PageResult>('/anomalies', { params })
}

export function getAnomalyDetail(id: string) {
  return request.get(`/anomalies/${id}`)
}

export function createAnomaly(data: any) {
  return request.post('/anomalies', data)
}

export function updateAnomaly(id: string, data: any) {
  return request.patch(`/anomalies/${id}`, data)
}

export function deleteAnomaly(id: string) {
  return request.delete(`/anomalies/${id}`)
}

export function batchAssignAnomalies(data: { ids: string[]; assigneeId: string }) {
  return request.post('/anomalies/batch-assign', data)
}

export function getAnomalyStatistics() {
  return request.get('/anomalies/statistics')
}

export function getPendingSummary() {
  return request.get('/anomalies/pending-summary')
}

export function getAnomalyEvents(id: string) {
  return request.get(`/anomalies/${id}/events`)
}

export function getAnomalyTrend(id: string) {
  return request.get(`/anomalies/${id}/trend`)
}
