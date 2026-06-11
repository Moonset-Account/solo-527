import { get, post, put, del, patch } from '@/utils/request'

export interface ChangeLogItem {
  oldValue: any
  newValue: any
  modifiedBy: string
  modifiedAt: string
}

export interface ConfigItem {
  _id: string
  key: string
  value: any
  type: string
  enabled: boolean
  remark: string
  modifiedBy: string
  version: number
  changeLog: ChangeLogItem[]
  createdAt: string
  updatedAt: string
}

export interface ConfigListResult {
  data: ConfigItem[]
  total: number
  page: number
  pageSize: number
}

export interface CreateConfigParams {
  key: string
  value: any
  type: string
  enabled?: boolean
  remark?: string
  modifiedBy?: string
  version?: number
}

export interface UpdateConfigParams {
  value?: any
  type?: string
  enabled?: boolean
  remark?: string
  modifiedBy?: string
  version?: number
}

export interface QueryConfigParams {
  key?: string
  type?: string
  enabled?: boolean
  page?: number
  pageSize?: number
}

export interface BatchUpdateConfigItem {
  key: string
  value: any
  modifiedBy?: string
}

export interface BatchUpdateConfigParams {
  items: BatchUpdateConfigItem[]
}

export function createConfig(params: CreateConfigParams) {
  return post<ConfigItem>('/configs', params)
}

export function getConfigList(params?: QueryConfigParams) {
  return get<ConfigListResult>('/configs', params)
}

export function getConfigByKey(key: string) {
  return get<ConfigItem>(`/configs/key/${key}`)
}

export function getConfigByType(type: string) {
  return get<ConfigItem[]>(`/configs/type/${type}`)
}

export function getConfigsGroupByType() {
  return get<Record<string, ConfigItem[]>>('/configs/group/by-type')
}

export function getConfigById(id: string) {
  return get<ConfigItem>(`/configs/${id}`)
}

export function getConfigChangeLog(id: string) {
  return get<ChangeLogItem[]>(`/configs/${id}/changelog`)
}

export function updateConfig(id: string, params: UpdateConfigParams) {
  return put<ConfigItem>(`/configs/${id}`, params)
}

export function deleteConfig(id: string) {
  return del<void>(`/configs/${id}`)
}

export function enableConfig(id: string, modifiedBy?: string, remark?: string) {
  return patch<ConfigItem>(`/configs/${id}/enable`, { modifiedBy, remark })
}

export function disableConfig(id: string, modifiedBy?: string, remark?: string) {
  return patch<ConfigItem>(`/configs/${id}/disable`, { modifiedBy, remark })
}
