import { create } from 'zustand';
import { api } from '@/api/client';
import type { ExceptionOrder } from '@/types';

interface ExceptionState {
  exceptions: ExceptionOrder[];
  total: number;
  loading: boolean;
  fetchExceptions: (params?: Record<string, string | number>) => Promise<void>;
  fetchException: (id: number) => Promise<ExceptionOrder>;
  resolveException: (id: number, resolutionNote: string) => Promise<void>;
}

export const useExceptionStore = create<ExceptionState>((set) => ({
  exceptions: [],
  total: 0,
  loading: false,

  fetchExceptions: async (params) => {
    set({ loading: true });
    try {
      const res = await api.getList<ExceptionOrder>('/exceptions', params);
      set({ exceptions: res.data, total: res.total });
    } finally {
      set({ loading: false });
    }
  },

  fetchException: async (id) => {
    return api.get<ExceptionOrder>(`/exceptions/${id}`);
  },

  resolveException: async (id, resolutionNote) => {
    await api.put(`/exceptions/${id}/resolve`, { resolutionNote });
  },
}));
