import request from '@/utils/request'

export function getOperationLogs(params) {
  return request.get('/operation-logs', { params })
}

export function getOperationLog(id) {
  return request.get(`/operation-logs/${id}`)
}

export function getRecentLogs(limit) {
  return request.get('/operation-logs/recent', { params: { limit } })
}

export function getLogsByModule(module, limit) {
  return request.get(`/operation-logs/module/${module}`, { params: { limit } })
}

export function getLogStats(days) {
  return request.get('/operation-logs/stats', { params: { days } })
}
