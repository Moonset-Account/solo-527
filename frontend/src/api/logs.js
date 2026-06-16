import request from '@/utils/request'

export function getLogList(params) {
  return request({
    url: '/logs',
    method: 'get',
    params
  })
}

export function getLog(id) {
  return request({
    url: `/logs/${id}`,
    method: 'get'
  })
}

export function exportLogs(params) {
  return request({
    url: '/logs/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function getLogStatistics(params) {
  return request({
    url: '/logs/statistics',
    method: 'get',
    params
  })
}

export function deleteLogs(data) {
  return request({
    url: '/logs',
    method: 'delete',
    data
  })
}
