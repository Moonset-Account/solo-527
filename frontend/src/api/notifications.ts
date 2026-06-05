import apiClient from './client';
import { Notification, PaginatedResponse } from '../types';

export const notificationsApi = {
  list: (params?: any) => 
    apiClient.get<PaginatedResponse<Notification>>('/notifications', { params }),
  markRead: (id: number) => apiClient.post(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/read-all'),
  getUnreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count'),
};
