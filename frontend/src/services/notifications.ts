import api from './api'
import type { Notification, Message, Conversation, ApiResponse } from '@/types'

export const notificationApi = {
  getList: (params?: any) =>
    api.get<ApiResponse<Notification[]>>('/notifications/notifications/', { params }),

  getDetail: (id: number) =>
    api.get<Notification>(`/notifications/notifications/${id}/`),

  create: (data: any) =>
    api.post<Notification>('/notifications/notifications/', data),

  update: (id: number, data: any) =>
    api.patch<Notification>(`/notifications/notifications/${id}/`, data),

  publish: (id: number) =>
    api.post<Notification>(`/notifications/notifications/${id}/publish/`),

  markRead: (id: number) =>
    api.post(`/notifications/notifications/${id}/mark_read/`),

  markAck: (id: number) =>
    api.post(`/notifications/notifications/${id}/mark_ack/`),

  getUnreadCount: () =>
    api.get<{ unread_count: number }>('/notifications/notifications/unread_count/'),

  getMessages: (params?: any) =>
    api.get<ApiResponse<Message[]>>('/notifications/messages/', { params }),

  sendMessage: (data: any) =>
    api.post<Message>('/notifications/messages/', data),

  getConversations: () =>
    api.get<Conversation[]>('/notifications/messages/conversations/'),

  markMessageRead: (id: number) =>
    api.post(`/notifications/messages/${id}/mark_read/`),

  markAllRead: (userId: number) =>
    api.post('/notifications/messages/mark_all_read/', { user_id: userId })
}
