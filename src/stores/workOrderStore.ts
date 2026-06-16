import { create } from 'zustand';
import { api } from '@/api/client';
import type { WorkOrder } from '@/types';

interface WorkOrderState {
  workOrders: WorkOrder[];
  total: number;
  loading: boolean;
  createLoading: boolean;
  followUpLoading: boolean;
  error: string | null;
  fetchWorkOrders: (params?: Record<string, string | number>) => Promise<void>;
  createWorkOrder: (data: Partial<WorkOrder>) => Promise<boolean>;
  updateWorkOrder: (id: number, data: Partial<WorkOrder>) => Promise<void>;
  submitFollowUp: (id: number, data: { followUpResult: string; satisfaction: number }) => Promise<boolean>;
}

export const useWorkOrderStore = create<WorkOrderState>((set) => ({
  workOrders: [],
  total: 0,
  loading: false,
  createLoading: false,
  followUpLoading: false,
  error: null,

  fetchWorkOrders: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getList<WorkOrder>('/work-orders', params);
      set({ workOrders: res.data, total: res.total });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取工单列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  createWorkOrder: async (data) => {
    set({ createLoading: true, error: null });
    try {
      await api.post('/work-orders', data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建工单失败' });
      return false;
    } finally {
      set({ createLoading: false });
    }
  },

  updateWorkOrder: async (id, data) => {
    set({ error: null });
    try {
      await api.put(`/work-orders/${id}`, data);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新工单失败' });
      throw err;
    }
  },

  submitFollowUp: async (id, data) => {
    set({ followUpLoading: true, error: null });
    try {
      await api.post(`/work-orders/${id}/follow-up`, data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '提交回访失败' });
      return false;
    } finally {
      set({ followUpLoading: false });
    }
  },
}));
