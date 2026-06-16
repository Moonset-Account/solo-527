import { create } from 'zustand';
import { api } from '@/api/client';
import type { Settlement, SettlementRule } from '@/types';

interface SettlementState {
  settlements: Settlement[];
  rules: SettlementRule[];
  total: number;
  loading: boolean;
  rulesLoading: boolean;
  currentSettlement: Settlement | null;
  detailLoading: boolean;
  error: string | null;
  fetchSettlements: (params?: Record<string, string | number>) => Promise<void>;
  fetchSettlement: (id: number) => Promise<void>;
  approveSettlement: (id: number, data: { status: string; remark?: string }) => Promise<boolean>;
  fetchRules: () => Promise<void>;
  createRule: (data: Partial<SettlementRule>) => Promise<boolean>;
  updateRule: (id: number, data: Partial<SettlementRule>) => Promise<boolean>;
  deleteRule: (id: number) => Promise<boolean>;
  clearCurrentSettlement: () => void;
}

export const useSettlementStore = create<SettlementState>((set) => ({
  settlements: [],
  rules: [],
  total: 0,
  loading: false,
  rulesLoading: false,
  currentSettlement: null,
  detailLoading: false,
  error: null,

  fetchSettlements: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getList<Settlement>('/settlements', params);
      set({ settlements: res.data, total: res.total });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取结算列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchSettlement: async (id) => {
    set({ detailLoading: true, error: null, currentSettlement: null });
    try {
      const res = await api.get<Settlement>(`/settlements/${id}`);
      set({ currentSettlement: res });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取结算详情失败' });
    } finally {
      set({ detailLoading: false });
    }
  },

  approveSettlement: async (id, data) => {
    set({ error: null });
    try {
      await api.put(`/settlements/${id}/approve`, data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '审批结算失败' });
      return false;
    }
  },

  fetchRules: async () => {
    set({ rulesLoading: true, error: null });
    try {
      const res = await api.getList<SettlementRule>('/settlements/rules');
      set({ rules: res.data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取结算规则失败' });
    } finally {
      set({ rulesLoading: false });
    }
  },

  createRule: async (data) => {
    set({ error: null });
    try {
      await api.post('/settlements/rules', data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建结算规则失败' });
      return false;
    }
  },

  updateRule: async (id, data) => {
    set({ error: null });
    try {
      await api.put(`/settlements/rules/${id}`, data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新结算规则失败' });
      return false;
    }
  },

  deleteRule: async (id) => {
    set({ error: null });
    try {
      await api.delete(`/settlements/rules/${id}`);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除结算规则失败' });
      return false;
    }
  },

  clearCurrentSettlement: () => {
    set({ currentSettlement: null });
  },
}));
