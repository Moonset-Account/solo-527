import { create } from 'zustand';
import {
  technicianApi,
  TechnicianDto,
  WorkstationDto,
  CreateTechnicianRequest,
  UpdateTechnicianRequest,
  CreateWorkstationRequest,
  UpdateWorkstationRequest
} from '@/services/api';

interface TechnicianState {
  technicians: TechnicianDto[];
  currentTechnician: TechnicianDto | null;
  workstations: WorkstationDto[];
  currentWorkstation: WorkstationDto | null;
  loading: boolean;
  error: string | null;

  fetchTechnicians: () => Promise<void>;
  fetchTechnician: (id: string) => Promise<void>;
  createTechnician: (data: CreateTechnicianRequest) => Promise<TechnicianDto>;
  updateTechnician: (id: string, data: UpdateTechnicianRequest) => Promise<TechnicianDto>;
  deleteTechnician: (id: string) => Promise<void>;
  setCurrentTechnician: (technician: TechnicianDto | null) => void;

  fetchWorkstations: () => Promise<void>;
  fetchWorkstation: (id: string) => Promise<void>;
  createWorkstation: (data: CreateWorkstationRequest) => Promise<WorkstationDto>;
  updateWorkstation: (id: string, data: UpdateWorkstationRequest) => Promise<WorkstationDto>;
  deleteWorkstation: (id: string) => Promise<void>;
  setCurrentWorkstation: (workstation: WorkstationDto | null) => void;

  clearError: () => void;
}

export const useTechnicianStore = create<TechnicianState>((set, get) => ({
  technicians: [],
  currentTechnician: null,
  workstations: [],
  currentWorkstation: null,
  loading: false,
  error: null,

  fetchTechnicians: async () => {
    set({ loading: true, error: null });
    try {
      const data = await technicianApi.getTechnicians();
      set({ technicians: data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取技师列表失败', loading: false });
    }
  },

  fetchTechnician: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const technician = await technicianApi.getTechnician(id);
      set({ currentTechnician: technician, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取技师详情失败', loading: false });
    }
  },

  createTechnician: async (data: CreateTechnicianRequest) => {
    set({ loading: true, error: null });
    try {
      const newTechnician = await technicianApi.createTechnician(data);
      const { technicians } = get();
      set({ technicians: [...technicians, newTechnician], loading: false });
      return newTechnician;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建技师失败', loading: false });
      throw err;
    }
  },

  updateTechnician: async (id: string, data: UpdateTechnicianRequest) => {
    set({ loading: true, error: null });
    try {
      const updated = await technicianApi.updateTechnician(id, data);
      const { technicians, currentTechnician } = get();
      set({
        technicians: technicians.map(t => t.id === id ? updated : t),
        currentTechnician: currentTechnician?.id === id ? updated : currentTechnician,
        loading: false
      });
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新技师失败', loading: false });
      throw err;
    }
  },

  deleteTechnician: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await technicianApi.deleteTechnician(id);
      const { technicians, currentTechnician } = get();
      set({
        technicians: technicians.filter(t => t.id !== id),
        currentTechnician: currentTechnician?.id === id ? null : currentTechnician,
        loading: false
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除技师失败', loading: false });
      throw err;
    }
  },

  setCurrentTechnician: (technician) => {
    set({ currentTechnician: technician });
  },

  fetchWorkstations: async () => {
    set({ loading: true, error: null });
    try {
      const data = await technicianApi.getWorkstations();
      set({ workstations: data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取工位列表失败', loading: false });
    }
  },

  fetchWorkstation: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const workstation = await technicianApi.getWorkstation(id);
      set({ currentWorkstation: workstation, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取工位详情失败', loading: false });
    }
  },

  createWorkstation: async (data: CreateWorkstationRequest) => {
    set({ loading: true, error: null });
    try {
      const newWorkstation = await technicianApi.createWorkstation(data);
      const { workstations } = get();
      set({ workstations: [...workstations, newWorkstation], loading: false });
      return newWorkstation;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建工位失败', loading: false });
      throw err;
    }
  },

  updateWorkstation: async (id: string, data: UpdateWorkstationRequest) => {
    set({ loading: true, error: null });
    try {
      const updated = await technicianApi.updateWorkstation(id, data);
      const { workstations, currentWorkstation } = get();
      set({
        workstations: workstations.map(w => w.id === id ? updated : w),
        currentWorkstation: currentWorkstation?.id === id ? updated : currentWorkstation,
        loading: false
      });
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新工位失败', loading: false });
      throw err;
    }
  },

  deleteWorkstation: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await technicianApi.deleteWorkstation(id);
      const { workstations, currentWorkstation } = get();
      set({
        workstations: workstations.filter(w => w.id !== id),
        currentWorkstation: currentWorkstation?.id === id ? null : currentWorkstation,
        loading: false
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除工位失败', loading: false });
      throw err;
    }
  },

  setCurrentWorkstation: (workstation) => {
    set({ currentWorkstation: workstation });
  },

  clearError: () => {
    set({ error: null });
  }
}));
