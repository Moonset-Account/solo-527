import request from './request'

export function getTechnicianWorkloadStats(params?: {
  period?: 'day' | 'week' | 'month'
  startDate?: string
  endDate?: string
}) {
  return request.get('/admin/statistics/technician-workload', { params })
}

export function getRepeatPurchaseStats(params?: {
  groupBy?: 'community' | 'date' | 'channel'
  startDate?: string
  endDate?: string
}) {
  return request.get('/admin/statistics/repeat-purchase', { params })
}

export function getLateReasonStats(params?: {
  startDate?: string
  endDate?: string
}) {
  return request.get('/admin/statistics/late-reasons', { params })
}

export function getOverviewStats() {
  return request.get('/admin/statistics/overview')
}
