import request from '@/utils/request'

export function getUsageTrends(params) {
  return request({
    url: '/usage/trends',
    method: 'get',
    params
  })
}

export function getUsageRecords(params) {
  return request({
    url: '/usage/records',
    method: 'get',
    params
  })
}

export function getUsageErrors(params) {
  return request({
    url: '/usage/errors',
    method: 'get',
    params
  })
}

export function getUsageSummary(params) {
  return request({
    url: '/usage/summary',
    method: 'get',
    params
  })
}

export function getSeatUsage(seatId, params) {
  return request({
    url: `/usage/seat/${seatId}`,
    method: 'get',
    params
  })
}
