import { create } from 'zustand';
import { api } from '@/api/client';
import type { WorkOrder } from '@/types';

interface WorkOrderState {
  workOrders: WorkOrder[];
  total: number;
  loading: boolean;
  fetchWorkOrders: (params?: Record<string, string | number>) => Promise<void>;
  createWorkOrder: (data: Partial<WorkOrder>) => Promise<void>;
  updateWorkOrder: (id: number, data: Partial<WorkOrder>) => Promise<void>;
  submitFollowUp: (id: number, data: { followUpResult: string; satisfaction: number }) => Promise<void>;
}

export const useWorkOrderStore = create<WorkOrderState>((set) => ({
  workOrders: [],
  total: 0,
  loading: false,

  fetchWorkOrders: async (params) => {
    set({ loading: true });
    try {
      const res = await api.getList<WorkOrder>('/work-orders', params);
      set({ workOrders: res.data, total: res.total });
    } finally {
      set({ loading: false });
    }
  },

  createWorkOrder: async (data) => {
    await api.post('/work-orders', data);
  },

  updateWorkOrder: async (id, data) => {
    await api.put(`/work-orders/${id}`, data);
  },

  submitFollowUp: async (id, data) => {
    await api.post(`/work-orders/${id}/follow-up`, data);
  },
}));
