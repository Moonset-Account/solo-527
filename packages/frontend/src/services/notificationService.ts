import api from './api';
import { Notification, NotificationType } from '../types';

export const notificationService = {
  getAll: (params?: {
    isRead?: boolean;
    type?: NotificationType;
    page?: number;
    limit?: number;
  }) => api.get('/notifications', { params }),

  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put('/notifications/read-all'),

  getById: (id: string) => api.get<Notification>(`/notifications/${id}`),

  delete: (id: string) => api.delete(`/notifications/${id}`),
};
