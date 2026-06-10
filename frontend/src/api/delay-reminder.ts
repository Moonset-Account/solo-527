import request from './request'
import type { DelayReminder, PaginatedResponse, ApiResponse } from '@/types'

export const getDelayReminderList = (params?: Record<string, unknown>) => {
  return request.get<ApiResponse<PaginatedResponse<DelayReminder>>, ApiResponse<PaginatedResponse<DelayReminder>>>('/delay-reminders', { params })
}

export const getDelayReminderDetail = (id: number) => {
  return request.get<ApiResponse<DelayReminder>, ApiResponse<DelayReminder>>(`/delay-reminders/${id}`)
}

export const createDelayReminder = (data: Partial<DelayReminder>) => {
  return request.post<ApiResponse<DelayReminder>, ApiResponse<DelayReminder>>('/delay-reminders', data)
}

export const updateDelayReminder = (id: number, data: Partial<DelayReminder>) => {
  return request.patch<ApiResponse<DelayReminder>, ApiResponse<DelayReminder>>(`/delay-reminders/${id}`, data)
}

export const deleteDelayReminder = (id: number) => {
  return request.delete<ApiResponse<void>, ApiResponse<void>>(`/delay-reminders/${id}`)
}

export const getDelayRemindersByProject = (projectId: number) => {
  return request.get<ApiResponse<DelayReminder[]>, ApiResponse<DelayReminder[]>>(`/delay-reminders/project/${projectId}`)
}

export const resolveDelayReminder = (id: number, handler?: string) => {
  return request.patch<ApiResponse<DelayReminder>, ApiResponse<DelayReminder>>(`/delay-reminders/${id}/resolve`, { handler })
}
