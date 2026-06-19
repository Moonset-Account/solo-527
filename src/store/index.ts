import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, DashboardStats, TodoItem, Notification } from '@/types';
import { authApi, dashboardApi, notificationApi } from '@/api';

interface AppState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  dashboardStats: DashboardStats | null;
  todoList: TodoItem[];
  notifications: Notification[];
  unreadCount: number;

  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  loadDashboardData: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      dashboardStats: null,
      todoList: [],
      notifications: [],
      unreadCount: 0,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ username, password });
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('user', JSON.stringify(response.user));
          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            dashboardStats: null,
            todoList: [],
            notifications: [],
            unreadCount: 0,
          });
        }
      },

      getCurrentUser: async () => {
        try {
          const user = await authApi.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch (error) {
          set({ isAuthenticated: false });
          throw error;
        }
      },

      loadDashboardData: async () => {
        set({ isLoading: true });
        try {
          const [stats, todos] = await Promise.all([
            dashboardApi.getStats(),
            dashboardApi.getTodoList(),
          ]);
          set({
            dashboardStats: stats,
            todoList: todos,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loadNotifications: async () => {
        try {
          const result = await notificationApi.getList({ page: 1, size: 10 });
          set({
            notifications: result.content,
            unreadCount: result.unreadCount,
          });
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      },

      markNotificationRead: async (id: string) => {
        try {
          await notificationApi.markAsRead(id);
          const notifications = get().notifications.map((n) =>
            n.id === id ? { ...n, status: 'READ' as const } : n
          );
          const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;
          set({ notifications, unreadCount });
        } catch (error) {
          console.error('Failed to mark notification read:', error);
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
