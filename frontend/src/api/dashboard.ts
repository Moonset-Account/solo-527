import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export function getDashboardOverview() {
  return request.get('/dashboard/overview')
}

export function getDashboardTodo() {
  return request.get('/dashboard/todo')
}

export function getDashboard() {
  return request.get('/dashboard')
}

export function clearDashboardCache() {
  return request.delete('/dashboard/cache')
}
