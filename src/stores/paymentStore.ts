import { create } from 'zustand';
import { api } from '@/api/client';
import type { PaymentRecord } from '@/types';

interface PaymentState {
  payments: PaymentRecord[];
  total: number;
  loading: boolean;
  retryLoading: number | null;
  fetchPayments: (params?: Record<string, string | number>) => Promise<void>;
  retryPayment: (id: number) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  payments: [],
  total: 0,
  loading: false,
  retryLoading: null,

  fetchPayments: async (params) => {
    set({ loading: true });
    try {
      const res = await api.getList<PaymentRecord>('/payments', params);
      set({ payments: res.data, total: res.total });
    } finally {
      set({ loading: false });
    }
  },

  retryPayment: async (id) => {
    set({ retryLoading: id });
    try {
      await api.post(`/payments/${id}/retry`);
    } finally {
      set({ retryLoading: null });
    }
  },
}));
