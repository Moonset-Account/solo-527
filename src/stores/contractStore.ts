import { create } from 'zustand';
import { api } from '@/api/client';
import type { Contract, ContractTemplate } from '@/types';

interface ContractState {
  contracts: Contract[];
  templates: ContractTemplate[];
  total: number;
  loading: boolean;
  templatesLoading: boolean;
  currentContract: Contract | null;
  detailLoading: boolean;
  error: string | null;
  fetchContracts: (params?: Record<string, string | number>) => Promise<void>;
  fetchContract: (id: number) => Promise<void>;
  createContract: (data: Partial<Contract>) => Promise<boolean>;
  signContract: (id: number, action: string) => Promise<boolean>;
  fetchTemplates: () => Promise<void>;
  createTemplate: (data: Partial<ContractTemplate>) => Promise<boolean>;
  updateTemplate: (id: number, data: Partial<ContractTemplate>) => Promise<boolean>;
  deleteTemplate: (id: number) => Promise<boolean>;
  clearCurrentContract: () => void;
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: [],
  templates: [],
  total: 0,
  loading: false,
  templatesLoading: false,
  currentContract: null,
  detailLoading: false,
  error: null,

  fetchContracts: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getList<Contract>('/contracts', params);
      set({ contracts: res.data, total: res.total });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取合同列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchContract: async (id) => {
    set({ detailLoading: true, error: null, currentContract: null });
    try {
      const res = await api.get<Contract>(`/contracts/${id}`);
      set({ currentContract: res });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取合同详情失败' });
    } finally {
      set({ detailLoading: false });
    }
  },

  createContract: async (data) => {
    set({ error: null });
    try {
      await api.post('/contracts', data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建合同失败' });
      return false;
    }
  },

  signContract: async (id, action) => {
    set({ error: null });
    try {
      await api.put(`/contracts/${id}/sign`, { action });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '签署合同失败' });
      return false;
    }
  },

  fetchTemplates: async () => {
    set({ templatesLoading: true, error: null });
    try {
      const res = await api.getList<ContractTemplate>('/contracts/templates');
      set({ templates: res.data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取合同模板失败' });
    } finally {
      set({ templatesLoading: false });
    }
  },

  createTemplate: async (data) => {
    set({ error: null });
    try {
      await api.post('/contracts/templates', data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建合同模板失败' });
      return false;
    }
  },

  updateTemplate: async (id, data) => {
    set({ error: null });
    try {
      await api.put(`/contracts/templates/${id}`, data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新合同模板失败' });
      return false;
    }
  },

  deleteTemplate: async (id) => {
    set({ error: null });
    try {
      await api.delete(`/contracts/templates/${id}`);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除合同模板失败' });
      return false;
    }
  },

  clearCurrentContract: () => {
    set({ currentContract: null });
  },
}));
