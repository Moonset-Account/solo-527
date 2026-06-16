import { create } from 'zustand';
import { api } from '@/api/client';
import type { Contract, ContractTemplate } from '@/types';

interface ContractState {
  contracts: Contract[];
  templates: ContractTemplate[];
  total: number;
  loading: boolean;
  fetchContracts: (params?: Record<string, string | number>) => Promise<void>;
  fetchContract: (id: number) => Promise<Contract>;
  createContract: (data: Partial<Contract>) => Promise<void>;
  signContract: (id: number, action: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  createTemplate: (data: Partial<ContractTemplate>) => Promise<void>;
  updateTemplate: (id: number, data: Partial<ContractTemplate>) => Promise<void>;
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: [],
  templates: [],
  total: 0,
  loading: false,

  fetchContracts: async (params) => {
    set({ loading: true });
    try {
      const res = await api.getList<Contract>('/contracts', params);
      set({ contracts: res.data, total: res.total });
    } finally {
      set({ loading: false });
    }
  },

  fetchContract: async (id) => {
    return api.get<Contract>(`/contracts/${id}`);
  },

  createContract: async (data) => {
    await api.post('/contracts', data);
  },

  signContract: async (id, action) => {
    await api.put(`/contracts/${id}/sign`, { action });
  },

  fetchTemplates: async () => {
    const res = await api.get<ContractTemplate[]>('/contract-templates');
    set({ templates: res });
  },

  createTemplate: async (data) => {
    await api.post('/contract-templates', data);
  },

  updateTemplate: async (id, data) => {
    await api.put(`/contract-templates/${id}`, data);
  },
}));
