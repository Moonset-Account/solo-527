import request from './request'

export interface Config {
  id: number
  key: string
  value: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface ConfigHistory {
  id: number
  configId: number
  oldValue: string
  newValue: string
  operator: string
  createdAt: string
}

export function getConfigList(params?: any) {
  return request.get<{ list: Config[]; total: number }>('/admin/configs', { params })
}

export function getConfigDetail(key: string) {
  return request.get<Config>(`/admin/configs/${key}`)
}

export function updateConfig(key: string, value: string, description?: string) {
  return request.put<Config>(`/admin/configs/${key}`, { value, description })
}

export function getConfigHistory(configId: number, params?: any) {
  return request.get<{ list: ConfigHistory[]; total: number }>(`/admin/configs/${configId}/history`, { params })
}
