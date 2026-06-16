import request from '@/utils/request'

export function getApiLogPage(params) {
  return request({
    url: '/api-log/page',
    method: 'get',
    params
  })
}

export function getApiLogDetail(id) {
  return request({
    url: `/api-log/${id}`,
    method: 'get'
  })
}

export function getRetryList() {
  return request({
    url: '/api-log/retry/list',
    method: 'get'
  })
}

export function markForRetry(id) {
  return request({
    url: `/api-log/retry/mark/${id}`,
    method: 'post'
  })
}

export function retryApiLog(id) {
  return request({
    url: `/api-log/retry/${id}`,
    method: 'post'
  })
}

export function exportApiLog(params) {
  return request({
    url: '/api-log/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
