import { create } from 'zustand';
import api from '@/api';
import type { Reminder, ReminderRule } from '@/types';

interface ReminderState {
  reminders: Reminder[];
  rules: ReminderRule[];
  unreadCount: number;
  overdueCount: number;
  isLoading: boolean;
  error: string | null;

  fetchReminders: (params?: Record<string, unknown>) => Promise<void>;
  fetchRules: (params?: Record<string, unknown>) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  handleReminder: (id: string, status: string, notes?: string) => Promise<void>;
  createRule: (data: Partial<ReminderRule>) => Promise<void>;
  updateRule: (id: string, data: Partial<ReminderRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  rules: [],
  unreadCount: 0,
  overdueCount: 0,
  isLoading: false,
  error: null,

  fetchReminders: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.reminders.list(params);
      set({ reminders: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取提醒列表失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchRules: async (params) => {
    set({ isLoading: true });
    try {
      const response = await api.reminders.rules.list(params);
      set({ rules: response.data.results, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取提醒规则失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.reminders.getStats();
      set({
        unreadCount: response.data.total_pending,
        overdueCount: response.data.total_overdue,
      });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  handleReminder: async (id: string, status: string, notes?: string) => {
    try {
      await api.reminders.handle(id, { status, notes });
      const reminders = get().reminders.map((r) =>
        r.id === id ? { ...r, status: status as typeof r.status } : r
      );
      set({ reminders });
      get().fetchUnreadCount();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '处理提醒失败';
      set({ error: message });
      throw error;
    }
  },

  createRule: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.reminders.rules.create(data);
      set((state) => ({
        rules: [...state.rules, response.data],
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '创建提醒规则失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateRule: async (id: string, data) => {
    set({ isLoading: true });
    try {
      const response = await api.reminders.rules.update(id, data);
      const rules = get().rules.map((r) => (r.id === id ? response.data : r));
      set({ rules, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新提醒规则失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteRule: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.reminders.rules.delete(id);
      const rules = get().rules.filter((r) => r.id !== id);
      set({ rules, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '删除提醒规则失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
