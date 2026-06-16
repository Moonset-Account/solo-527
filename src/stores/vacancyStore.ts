import { create } from 'zustand';
import { api } from '@/api/client';
import type { VacancyStats, VacancyAlert } from '@/types';

interface VacancyState {
  stats: VacancyStats[];
  alerts: VacancyAlert[];
  loading: boolean;
  fetchStats: (days?: number) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  markAlertRead: (id: number) => Promise<void>;
}

export const useVacancyStore = create<VacancyState>((set, get) => ({
  stats: [],
  alerts: [],
  loading: false,

  fetchStats: async (days = 30) => {
    set({ loading: true });
    try {
      const res = await api.get<VacancyStats[]>('/vacancy/stats', { days });
      set({ stats: res });
    } finally {
      set({ loading: false });
    }
  },

  fetchAlerts: async () => {
    const res = await api.get<VacancyAlert[]>('/vacancy/alerts');
    set({ alerts: res });
  },

  markAlertRead: async (id) => {
    await api.put(`/vacancy/alerts/${id}/read`);
    const alerts = get().alerts.map((a) =>
      a.id === id ? { ...a, isRead: true } : a
    );
    set({ alerts });
  },
}));
