import { create } from 'zustand';
import { api } from '@/lib/api';

interface SlaStats {
  avgHandlingMinutes: number;
  complianceRate: number;
  overdueCount: number;
}

interface SlaDetail {
  id: number;
  ticketId: number;
  ticketTitle: string;
  stage: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMinutes: number | null;
  isOverdue: boolean;
}

interface SlaQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface SlaState {
  stats: SlaStats | null;
  details: SlaDetail[];
  total: number;
  loading: boolean;
  fetchSlaStats: (query?: SlaQuery) => Promise<void>;
  fetchSlaDetails: (query?: SlaQuery) => Promise<void>;
}

export const useSlaStore = create<SlaState>((set) => ({
  stats: null,
  details: [],
  total: 0,
  loading: false,

  fetchSlaStats: async (query?: SlaQuery) => {
    try {
      const params: Record<string, string | number | undefined> = {
        startDate: query?.startDate,
        endDate: query?.endDate,
      };
      const stats = await api.get<SlaStats>('/sla/stats', params);
      set({ stats });
    } catch {
      // keep existing
    }
  },

  fetchSlaDetails: async (query?: SlaQuery) => {
    set({ loading: true });
    try {
      const params: Record<string, string | number | undefined> = {
        page: query?.page || 1,
        limit: query?.limit || 20,
        startDate: query?.startDate,
        endDate: query?.endDate,
      };
      const res = await api.get<{ items: SlaDetail[]; total: number }>('/sla/details', params);
      set({ details: res.items, total: res.total, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
