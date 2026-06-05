import { create } from 'zustand';
import type { Notification } from '@/types';
import { notificationsApi } from '@/lib/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    const data = await notificationsApi.list();
    set({ notifications: data, unreadCount: data.filter((n) => !n.read).length });
  },

  markRead: async (id) => {
    await notificationsApi.markRead(id);
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
  },

  refreshUnreadCount: async () => {
    const data = await notificationsApi.list();
    set({ unreadCount: data.filter((n) => !n.read).length });
  },
}));
