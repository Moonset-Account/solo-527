import request from '@/utils/request'
import type { PageResult } from '@/utils/request'

export function getNotifications(params: any) {
  return request.get<PageResult>('/notifications', { params })
}

export function getUnreadCount() {
  return request.get<number>('/notifications/unread-count')
}

export function markAsRead(id: string) {
  return request.patch(`/notifications/${id}/read`)
}

export function markAllAsRead() {
  return request.patch('/notifications/read-all')
}

export function deleteNotification(id: string) {
  return request.delete(`/notifications/${id}`)
}
