import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export function getDatasets(params: any) {
  return request.get<PageResult>('/datasets', { params })
}

export function getDataset(id: string) {
  return request.get(`/datasets/${id}`)
}

export function createDataset(data: any) {
  return request.post('/datasets', data)
}

export function updateDataset(id: string, data: any) {
  return request.patch(`/datasets/${id}`, data)
}

export function deleteDataset(id: string) {
  return request.delete(`/datasets/${id}`)
}

export function addDatasetPermissions(id: string, data: any) {
  return request.post(`/datasets/${id}/permissions`, data)
}

export function updateDatasetPermission(id: string, data: any) {
  return request.patch(`/datasets/${id}/permissions`, data)
}

export function removeDatasetPermission(id: string, userId: string) {
  return request.delete(`/datasets/${id}/permissions/${userId}`)
}

export function getExpiringPermissions(days: number = 7) {
  return request.get('/datasets/expiring-permissions', { params: { days } })
}
