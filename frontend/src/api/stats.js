import request from '../utils/request'

export function getDashboardStats(params) {
  return request({
    url: '/stats/dashboard',
    method: 'get',
    params
  })
}

export function getTodoStats() {
  return request({
    url: '/stats/todo',
    method: 'get'
  })
}
