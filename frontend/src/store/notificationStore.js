import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchUnreadCount: async () => {
    try {
      const res = await api.get('/notifications/unread_count/');
      set({ unreadCount: res.data.unread_count });
    } catch (err) {
      console.error(err);
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/notifications/unread/');
      set({ notifications: res.data.results || res.data });
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  markAllRead: async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      set({ unreadCount: 0, notifications: [] });
    } catch (err) {
      console.error(err);
    }
  },

  markRead: async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`);
      const notifs = get().notifications.filter(n => n.id !== id);
      set({ notifications: notifs, unreadCount: Math.max(0, get().unreadCount - 1) });
    } catch (err) {
      console.error(err);
    }
  },
}));
