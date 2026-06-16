import { create } from 'zustand';
import { api } from '@/api/client';
import type { AppointmentSlotConfig, WorkflowNodeConfig } from '@/types';

interface ConfigState {
  slots: AppointmentSlotConfig[];
  workflowNodes: WorkflowNodeConfig[];
  slotsLoading: boolean;
  nodesLoading: boolean;
  error: string | null;
  fetchSlots: () => Promise<void>;
  createSlot: (data: Partial<AppointmentSlotConfig>) => Promise<boolean>;
  updateSlot: (id: number, data: Partial<AppointmentSlotConfig>) => Promise<boolean>;
  deleteSlot: (id: number) => Promise<boolean>;
  fetchWorkflowNodes: () => Promise<void>;
  createWorkflowNode: (data: Partial<WorkflowNodeConfig>) => Promise<boolean>;
  updateWorkflowNode: (id: number, data: Partial<WorkflowNodeConfig>) => Promise<boolean>;
  deleteWorkflowNode: (id: number) => Promise<boolean>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  slots: [],
  workflowNodes: [],
  slotsLoading: false,
  nodesLoading: false,
  error: null,

  fetchSlots: async () => {
    set({ slotsLoading: true, error: null });
    try {
      const res = await api.getList<AppointmentSlotConfig>('/config/appointment-slots');
      set({ slots: res.data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取预约时段失败' });
    } finally {
      set({ slotsLoading: false });
    }
  },

  createSlot: async (data) => {
    set({ error: null });
    try {
      await api.post('/config/appointment-slots', data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建预约时段失败' });
      return false;
    }
  },

  updateSlot: async (id, data) => {
    set({ error: null });
    try {
      await api.put(`/config/appointment-slots/${id}`, data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新预约时段失败' });
      return false;
    }
  },

  deleteSlot: async (id) => {
    set({ error: null });
    try {
      await api.delete(`/config/appointment-slots/${id}`);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除预约时段失败' });
      return false;
    }
  },

  fetchWorkflowNodes: async () => {
    set({ nodesLoading: true, error: null });
    try {
      const res = await api.getList<WorkflowNodeConfig>('/config/workflow-nodes');
      set({ workflowNodes: res.data });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取工作流节点失败' });
    } finally {
      set({ nodesLoading: false });
    }
  },

  createWorkflowNode: async (data) => {
    set({ error: null });
    try {
      await api.post('/config/workflow-nodes', data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建工作流节点失败' });
      return false;
    }
  },

  updateWorkflowNode: async (id, data) => {
    set({ error: null });
    try {
      await api.put(`/config/workflow-nodes/${id}`, data);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新工作流节点失败' });
      return false;
    }
  },

  deleteWorkflowNode: async (id) => {
    set({ error: null });
    try {
      await api.delete(`/config/workflow-nodes/${id}`);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除工作流节点失败' });
      return false;
    }
  },
}));
