import request from '@/utils/request'
import type { ConfigVersion, ReminderRule, ExportLog, PageResult, Result } from '@/types'

export const getConfigList = (params: {
  page?: number
  size?: number
  configType?: string
  configKey?: string
  status?: string
}) => {
  return request.get<Result<PageResult<ConfigVersion>>>('/admin/configs', { params })
}

export const getConfigById = (id: number) => {
  return request.get<Result<ConfigVersion>>(`/admin/configs/${id}`)
}

export const getConfigVersions = (configType: string, configKey: string) => {
  return request.get<Result<ConfigVersion[]>>('/admin/configs/versions', {
    params: { configType, configKey },
  })
}

export const getActiveConfig = (configType: string, configKey: string) => {
  return request.get<Result<ConfigVersion>>('/admin/configs/active', {
    params: { configType, configKey },
  })
}

export const createConfigVersion = (data: ConfigVersion) => {
  return request.post<Result<ConfigVersion>>('/admin/configs', data)
}

export const updateConfigStatus = (id: number, status: string) => {
  return request.put<Result<ConfigVersion>>(`/admin/configs/${id}/status`, null, {
    params: { status },
  })
}

export const deleteConfig = (id: number) => {
  return request.delete<Result<void>>(`/admin/configs/${id}`)
}

export const getReminderRuleList = (params: {
  page?: number
  size?: number
  ruleCode?: string
  ruleName?: string
  ruleType?: string
  enabled?: boolean
}) => {
  return request.get<Result<PageResult<ReminderRule>>>('/admin/reminder-rules', { params })
}

export const getReminderRuleById = (id: number) => {
  return request.get<Result<ReminderRule>>(`/admin/reminder-rules/${id}`)
}

export const getReminderRuleByCode = (ruleCode: string) => {
  return request.get<Result<ReminderRule>>(`/admin/reminder-rules/code/${ruleCode}`)
}

export const getEnabledRulesByType = (ruleType: string) => {
  return request.get<Result<ReminderRule[]>>(`/admin/reminder-rules/type/${ruleType}`)
}

export const createReminderRule = (data: ReminderRule) => {
  return request.post<Result<ReminderRule>>('/admin/reminder-rules', data)
}

export const updateReminderRule = (data: ReminderRule) => {
  return request.put<Result<ReminderRule>>('/admin/reminder-rules', data)
}

export const toggleReminderRule = (id: number, enabled: boolean) => {
  return request.put<Result<ReminderRule>>(`/admin/reminder-rules/${id}/toggle`, null, {
    params: { enabled },
  })
}

export const deleteReminderRule = (id: number) => {
  return request.delete<Result<void>>(`/admin/reminder-rules/${id}`)
}

export const getExportLogList = (params: {
  page?: number
  size?: number
  exportNo?: string
  exportType?: string
  exportBy?: string
  startTime?: string
  endTime?: string
  status?: string
}) => {
  return request.get<Result<PageResult<ExportLog>>>('/admin/exports/logs', { params })
}

export const getExportLogByNo = (exportNo: string) => {
  return request.get<Result<ExportLog>>(`/admin/exports/logs/${exportNo}`)
}

export const exportInventoryDetails = (params: {
  hotelCode?: string
  roomType?: string
  roomNumber?: string
  startDate?: string
  endDate?: string
  roomStatus?: string
  cleanStatus?: string
}) => {
  return request.get('/admin/exports/inventory-details', {
    params,
    responseType: 'blob',
  })
}
