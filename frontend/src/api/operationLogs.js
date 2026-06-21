import request from './request'

export function getOperationLogs(params) {
  return request.get('/operation-logs', { params })
}

export function getOperationLog(id) {
  return request.get(`/operation-logs/${id}`)
}
