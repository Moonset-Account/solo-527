import request from './request'

export interface ConfigUpdatedBy {
  userId: string
  userName: string
}

export interface Config {
  _id: string
  type: 'notification_receipt' | 'club_activity' | 'secondhand_trade'
  key: string
  value: string
  updatedBy: ConfigUpdatedBy
  description?: string
  createdAt: string
  updatedAt: string
}

export interface ConfigListParams {
  type?: string
}

export interface CreateConfigData {
  type: string
  key: string
  value: string
  updatedBy: ConfigUpdatedBy
  description?: string
}

export interface UpdateConfigData {
  value?: string
  updatedBy?: ConfigUpdatedBy
  description?: string
}

export const getConfigs = (params?: ConfigListParams) => {
  return request.get('/configs', { params })
}

export const createConfig = (data: CreateConfigData) => {
  return request.post('/configs', data)
}

export const updateConfig = (id: string, data: UpdateConfigData) => {
  return request.patch(`/configs/${id}`, data)
}

export const configTypeMap: Record<string, string> = {
  notification_receipt: '通知回执',
  club_activity: '社团活动',
  secondhand_trade: '二手交易'
}

export const configTypeKeyMap: Record<string, string> = {
  '通知回执': 'notification_receipt',
  '社团活动': 'club_activity',
  '二手交易': 'secondhand_trade'
}
