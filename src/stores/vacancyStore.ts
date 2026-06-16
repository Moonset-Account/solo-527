import { create } from 'zustand';
import { api } from '@/api/client';
import type { VacancyStats, VacancyAlert } from '@/types';

interface VacancyState {
  stats: VacancyStats[];
  alerts: VacancyAlert[];
  alertsTotal: number;
  loading: boolean;
  alertsLoading: boolean;
  error: string | null;
  fetchStats: (days?: number) => Promise<void>;
  fetchAlerts: (params?: Record<string, string | number>) => Promise<void>;
  markAlertRead: (id: number) => Promise<boolean>;
}

export const useVacancyStore = create<VacancyState>((set, get) => ({
  stats: [],
  alerts: [],
  alertsTotal: 0,
  loading: false,
  alertsLoading: false,
  error: null,

  fetchStats: async (days = 30) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<VacancyStats[]>('/vacancy/stats', { days });
      set({ stats: res });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取空置统计失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchAlerts: async (params) => {
    set({ alertsLoading: true, error: null });
    try {
      const res = await api.getList<VacancyAlert>('/vacancy/alerts', params);
      set({ alerts: res.data, alertsTotal: res.total });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取空置预警失败' });
    } finally {
      set({ alertsLoading: false });
    }
  },

  markAlertRead: async (id) => {
    set({ error: null });
    try {
      await api.put(`/vacancy/alerts/${id}/read`);
      const alerts = get().alerts.map((a) =>
        a.id === id ? { ...a, isRead: true } : a
      );
      set({ alerts });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '标记已读失败' });
      return false;
    }
  },
}));
