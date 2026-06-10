import request from '@/utils/request'

export function getCashierRecords(params) {
  return request.get('/cashier', { params })
}

export function getCashierRecord(id) {
  return request.get(`/cashier/${id}`)
}

export function createCashierRecord(data) {
  return request.post('/cashier', data)
}

export function refundCashierRecord(id, refundAmount) {
  return request.post(`/cashier/${id}/refund`, { refundAmount })
}

export function getDailyStats(date) {
  return request.get('/cashier/daily-stats', { params: { date } })
}
