import { create } from 'zustand';
import {
  dashboardApi,
  DashboardSummaryDto
} from '@/services/api';

interface DashboardState {
  summary: DashboardSummaryDto | null;
  loading: boolean;
  error: string | null;

  fetchDashboardSummary: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  loading: false,
  error: null,

  fetchDashboardSummary: async () => {
    set({ loading: true, error: null });
    try {
      const data = await dashboardApi.getDashboardSummary();
      set({ summary: data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取仪表盘数据失败', loading: false });
    }
  },

  refreshDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const data = await dashboardApi.getDashboardSummary();
      set({ summary: data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '刷新仪表盘数据失败', loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
