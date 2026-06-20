import request, { PaginatedResponse } from './index'

export interface Notification {
  id: number
  recipient: number
  recipient_name: string
  title: string
  content: string
  notification_type: string
  notification_type_display: string
  status: string
  status_display: string
  related_type: string
  related_id: string
  rule: number | null
  rule_name: string
  read_at: string
  created_at: string
}

export interface NotificationRule {
  id: number
  name: string
  event_type: string
  event_type_display: string
  trigger: string
  trigger_display: string
  method: string
  method_display: string
  severity_level: string
  alert_levels: string
  channels: string[]
  recipients: number[]
  recipient_emails: string
  recipient_count: number
  template: string
  is_enabled: boolean
  is_active: boolean
  description: string
  created_at: string
}

export const notificationApi = {
  list: (params?: any) =>
    request.get<any, PaginatedResponse<Notification>>('/notifications/messages/', { params }),

  unreadCount: () =>
    request.get<any, { count: number }>('/notifications/messages/unread_count/'),

  markAllRead: () =>
    request.post('/notifications/messages/mark_all_read/'),

  markRead: (id: number) =>
    request.post(`/notifications/messages/${id}/mark_read/`),

  ruleList: (params?: any) =>
    request.get<any, PaginatedResponse<NotificationRule>>('/notifications/rules/', { params }),

  rules: (params?: any) =>
    request.get<any, PaginatedResponse<NotificationRule>>('/notifications/rules/', { params }),

  ruleDetail: (id: number) =>
    request.get<any, NotificationRule>(`/notifications/rules/${id}/`),

  ruleCreate: (data: any) =>
    request.post('/notifications/rules/', data),

  createRule: (data: any) =>
    request.post('/notifications/rules/', data),

  ruleUpdate: (id: number, data: any) =>
    request.put(`/notifications/rules/${id}/`, data),

  updateRule: (id: number, data: any) =>
    request.put(`/notifications/rules/${id}/`, data),

  ruleDelete: (id: number) =>
    request.delete(`/notifications/rules/${id}/`),

  deleteRule: (id: number) =>
    request.delete(`/notifications/rules/${id}/`),
}
