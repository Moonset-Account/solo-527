import { create } from 'zustand';
import { api } from '@/api/client';
import type { AppointmentSlotConfig, WorkflowNodeConfig } from '@/types';

interface ConfigState {
  slots: AppointmentSlotConfig[];
  workflowNodes: WorkflowNodeConfig[];
  loading: boolean;
  fetchSlots: () => Promise<void>;
  createSlot: (data: Partial<AppointmentSlotConfig>) => Promise<void>;
  updateSlot: (id: number, data: Partial<AppointmentSlotConfig>) => Promise<void>;
  fetchWorkflowNodes: () => Promise<void>;
  createWorkflowNode: (data: Partial<WorkflowNodeConfig>) => Promise<void>;
  updateWorkflowNode: (id: number, data: Partial<WorkflowNodeConfig>) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  slots: [],
  workflowNodes: [],
  loading: false,

  fetchSlots: async () => {
    set({ loading: true });
    try {
      const res = await api.get<AppointmentSlotConfig[]>('/configs/appointment-slots');
      set({ slots: res });
    } finally {
      set({ loading: false });
    }
  },

  createSlot: async (data) => {
    await api.post('/configs/appointment-slots', data);
  },

  updateSlot: async (id, data) => {
    await api.put(`/configs/appointment-slots/${id}`, data);
  },

  fetchWorkflowNodes: async () => {
    set({ loading: true });
    try {
      const res = await api.get<WorkflowNodeConfig[]>('/configs/workflow-nodes');
      set({ workflowNodes: res });
    } finally {
      set({ loading: false });
    }
  },

  createWorkflowNode: async (data) => {
    await api.post('/configs/workflow-nodes', data);
  },

  updateWorkflowNode: async (id, data) => {
    await api.put(`/configs/workflow-nodes/${id}`, data);
  },
}));
