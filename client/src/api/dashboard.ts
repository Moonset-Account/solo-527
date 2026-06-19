import { get } from '@/utils/request'
import type { DashboardData, DashboardTodoItem, ExceptionRecord } from '@/types'

export const getDashboardData = (): Promise<DashboardData> => {
  return get<DashboardData>('/dashboard/stats')
}

export const getWeeklyTrend = (): Promise<{ date: string; count: number }[]> => {
  return get<{ date: string; count: number }[]>('/dashboard/weekly-trend')
}

export const getServiceDistribution = (): Promise<{ name: string; value: number }[]> => {
  return get<{ name: string; value: number }[]>('/dashboard/service-distribution')
}

export const getTodayTodoList = (): Promise<DashboardTodoItem[]> => {
  return get<DashboardTodoItem[]>('/dashboard/todo-list')
}

export const getPendingExceptions = (): Promise<ExceptionRecord[]> => {
  return get<ExceptionRecord[]>('/dashboard/pending-exceptions')
}
