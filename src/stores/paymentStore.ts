import { create } from 'zustand';
import { api } from '@/api/client';
import type { PaymentRecord } from '@/types';

interface PaymentState {
  payments: PaymentRecord[];
  total: number;
  loading: boolean;
  retryLoading: number | null;
  error: string | null;
  fetchPayments: (params?: Record<string, string | number>) => Promise<void>;
  retryPayment: (id: number) => Promise<boolean>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  payments: [],
  total: 0,
  loading: false,
  retryLoading: null,
  error: null,

  fetchPayments: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getList<PaymentRecord>('/payments', params);
      set({ payments: res.data, total: res.total });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取支付列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  retryPayment: async (id) => {
    set({ retryLoading: id, error: null });
    try {
      await api.post(`/payments/${id}/retry`);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '重试失败' });
      return false;
    } finally {
      set({ retryLoading: null });
    }
  },
}));
