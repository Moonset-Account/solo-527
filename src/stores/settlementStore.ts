import { create } from 'zustand';
import { api } from '@/api/client';
import type { Settlement, SettlementRule } from '@/types';

interface SettlementState {
  settlements: Settlement[];
  rules: SettlementRule[];
  total: number;
  loading: boolean;
  fetchSettlements: (params?: Record<string, string | number>) => Promise<void>;
  fetchSettlement: (id: number) => Promise<Settlement>;
  approveSettlement: (id: number, data: { status: string; remark?: string }) => Promise<void>;
  fetchRules: () => Promise<void>;
  createRule: (data: Partial<SettlementRule>) => Promise<void>;
  updateRule: (id: number, data: Partial<SettlementRule>) => Promise<void>;
}

export const useSettlementStore = create<SettlementState>((set) => ({
  settlements: [],
  rules: [],
  total: 0,
  loading: false,

  fetchSettlements: async (params) => {
    set({ loading: true });
    try {
      const res = await api.getList<Settlement>('/settlements', params);
      set({ settlements: res.data, total: res.total });
    } finally {
      set({ loading: false });
    }
  },

  fetchSettlement: async (id) => {
    return api.get<Settlement>(`/settlements/${id}`);
  },

  approveSettlement: async (id, data) => {
    await api.put(`/settlements/${id}/approve`, data);
  },

  fetchRules: async () => {
    const res = await api.get<SettlementRule[]>('/settlement-rules');
    set({ rules: res });
  },

  createRule: async (data) => {
    await api.post('/settlement-rules', data);
  },

  updateRule: async (id, data) => {
    await api.put(`/settlement-rules/${id}`, data);
  },
}));
