import client from './client';
import type { Notification, UnreadCount, PaginatedResponse } from '@/types';

export async function getNotifications(params?: Record<string, unknown>): Promise<PaginatedResponse<Notification>> {
  const res = await client.get<PaginatedResponse<Notification>>('/notifications/', { params });
  return res.data;
}

export async function createNotification(data: Record<string, unknown>): Promise<Notification> {
  const res = await client.post<Notification>('/notifications/', data);
  return res.data;
}

export async function markAsRead(id: number): Promise<void> {
  await client.post(`/notifications/${id}/read/`);
}

export async function getUnreadCount(): Promise<UnreadCount> {
  const res = await client.get<UnreadCount>('/notifications/unread-count/');
  return res.data;
}
