import { create } from 'zustand';
import { api } from '@/api/client';
import type { ExceptionOrder } from '@/types';

interface ExceptionState {
  exceptions: ExceptionOrder[];
  total: number;
  loading: boolean;
  currentException: ExceptionOrder | null;
  detailLoading: boolean;
  resolveLoading: boolean;
  error: string | null;
  fetchExceptions: (params?: Record<string, string | number>) => Promise<void>;
  fetchException: (id: number) => Promise<void>;
  resolveException: (id: number, resolutionNote: string) => Promise<boolean>;
  clearCurrentException: () => void;
}

export const useExceptionStore = create<ExceptionState>((set) => ({
  exceptions: [],
  total: 0,
  loading: false,
  currentException: null,
  detailLoading: false,
  resolveLoading: false,
  error: null,

  fetchExceptions: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getList<ExceptionOrder>('/exceptions', params);
      set({ exceptions: res.data, total: res.total });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取异常列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchException: async (id) => {
    set({ detailLoading: true, error: null, currentException: null });
    try {
      const res = await api.get<ExceptionOrder>(`/exceptions/${id}`);
      set({ currentException: res });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取异常详情失败' });
    } finally {
      set({ detailLoading: false });
    }
  },

  resolveException: async (id, resolutionNote) => {
    set({ resolveLoading: true, error: null });
    try {
      await api.put(`/exceptions/${id}/resolve`, { resolutionNote });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '解决异常失败' });
      return false;
    } finally {
      set({ resolveLoading: false });
    }
  },

  clearCurrentException: () => {
    set({ currentException: null });
  },
}));
