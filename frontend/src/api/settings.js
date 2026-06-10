import request from '@/utils/request'

export function getSettings(params) {
  return request.get('/settings', { params })
}

export function getAllSettings() {
  return request.get('/settings/all')
}

export function getSettingByKey(key) {
  return request.get(`/settings/${key}`)
}

export function getSettingsByGroup(group) {
  return request.get(`/settings/group/${group}`)
}

export function updateSetting(key, value) {
  return request.put(`/settings/${key}`, { value })
}

export function batchUpdateSettings(settings) {
  return request.put('/settings/batch', settings)
}
