import request from '@/utils/request'

export function getCourtUsageTrend(params) {
  return request({
    url: '/report/court-usage-trend',
    method: 'get',
    params
  })
}

export function getInventoryReport(params) {
  return request({
    url: '/report/inventory',
    method: 'get',
    params
  })
}

export function generateCourtUsageStats(statDate) {
  return request({
    url: '/report/generate/court-usage',
    method: 'post',
    params: { statDate }
  })
}

export function generateInventoryReport(reportDate) {
  return request({
    url: '/report/generate/inventory',
    method: 'post',
    params: { reportDate }
  })
}
