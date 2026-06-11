import api, { ApiResponse, PaginatedResponse } from '../utils/api';

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent';
  category: string;
  recipientId: string;
  isRead: boolean;
  relatedType?: string;
  relatedId?: string;
  actionUrl?: string;
  priority: number;
  readAt?: string;
  createdAt: string;
}

export interface UnreadCount {
  total: number;
  urgent: number;
  normal: number;
}

export const notificationApi = {
  getNotifications: (params?: {
    type?: string;
    category?: string;
    isRead?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<Notification>>> =>
    api.get('/notifications', { params }),

  getUnreadCount: (): Promise<ApiResponse<UnreadCount>> =>
    api.get('/notifications/unread-count'),

  markAsRead: (id: string): Promise<ApiResponse<null>> =>
    api.put(`/notifications/${id}/read`),

  markAllAsRead: (): Promise<ApiResponse<null>> =>
    api.put('/notifications/read-all'),

  getEscalationRules: (): Promise<ApiResponse<any[]>> =>
    api.get('/notifications/escalation-rules'),

  createEscalationRule: (data: any): Promise<ApiResponse<any>> =>
    api.post('/notifications/escalation-rules', data),

  checkEscalation: (): Promise<ApiResponse<null>> =>
    api.post('/notifications/check-escalation'),

  getMyTasks: (): Promise<ApiResponse<any[]>> =>
    api.get('/notifications/tasks'),

  getNotificationDetail: (id: string): Promise<ApiResponse<any>> =>
    api.get(`/notifications/${id}/detail`),

  assignNotification: (id: string, data: { assigneeId: string; deadlineHours?: number }): Promise<ApiResponse<any>> =>
    api.post(`/notifications/${id}/assign`, data),

  completeTask: (taskId: string, remark?: string): Promise<ApiResponse<null>> =>
    api.post(`/notifications/tasks/${taskId}/complete`, { remark }),

  manualEscalate: (id: string): Promise<ApiResponse<null>> =>
    api.post(`/notifications/${id}/escalate`),
};
