import request from './index'

export function generateReport(data) {
  return request.post('/reports/generate', data)
}

export function getReports(params) {
  return request.get('/reports', { params })
}

export function getDelayRatio(params) {
  return request.get('/reports/delay-ratio', { params })
}

export function getDeptMetrics(params) {
  return request.get('/reports/dept-metrics', { params })
}
