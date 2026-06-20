import request from './request'

export interface Config {
  _id: string
  category: '通知回执' | '社团活动' | '二手交易'
  key: string
  value: string
  description: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface ConfigListParams {
  category?: string
  page?: number
  pageSize?: number
}

export const getConfigs = (params?: ConfigListParams) => {
  return request.get('/configs', { params })
}

export const createConfig = (data: Partial<Config>) => {
  return request.post('/configs', data)
}

export const updateConfig = (id: string, data: Partial<Config>) => {
  return request.put(`/configs/${id}`, data)
}
