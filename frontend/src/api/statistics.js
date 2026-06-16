import request from '@/utils/request'

export function getOverview(params) {
  return request({
    url: '/statistics/overview',
    method: 'get',
    params
  })
}

export function getEmailStatistics(params) {
  return request({
    url: '/statistics/emails',
    method: 'get',
    params
  })
}

export function getDraftStatistics(params) {
  return request({
    url: '/statistics/drafts',
    method: 'get',
    params
  })
}

export function getUserStatistics(params) {
  return request({
    url: '/statistics/users',
    method: 'get',
    params
  })
}

export function getTrendData(params) {
  return request({
    url: '/statistics/trend',
    method: 'get',
    params
  })
}

export function getCategoryStatistics(params) {
  return request({
    url: '/statistics/categories',
    method: 'get',
    params
  })
}

export function getPerformanceMetrics(params) {
  return request({
    url: '/statistics/performance',
    method: 'get',
    params
  })
}
