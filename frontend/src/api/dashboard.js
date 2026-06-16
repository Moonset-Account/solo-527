import request from '@/utils/request'

export function getDashboardStats() {
  return request({
    url: '/dashboard/stats',
    method: 'get'
  })
}

export function getDashboardTodos() {
  return request({
    url: '/dashboard/todos',
    method: 'get'
  })
}

export function getRecentActivity(params) {
  return request({
    url: '/dashboard/recent-activity',
    method: 'get',
    params
  })
}
