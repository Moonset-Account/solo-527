import request from './index'

export function getAuditLogs(params) {
  return request.get('/audit-logs', { params })
}
