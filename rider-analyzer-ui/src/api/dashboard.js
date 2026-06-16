import request from './request'

export function getStats() {
  return request.get('/dashboard/stats')
}

export function getSettlementAccuracy(params) {
  return request.get('/dashboard/settlement-accuracy', { params })
}
