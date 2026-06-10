import { create } from 'zustand';
import {
  partsShortageApi,
  PartsShortageDto,
  CreatePartsShortageRequest,
  UpdatePartsShortageStatusRequest
} from '@/services/api';

interface PartsShortageState {
  partsShortages: PartsShortageDto[];
  currentPartsShortage: PartsShortageDto | null;
  loading: boolean;
  error: string | null;

  fetchPartsShortages: () => Promise<void>;
  fetchPartsShortage: (id: string) => Promise<void>;
  createPartsShortage: (data: CreatePartsShortageRequest) => Promise<PartsShortageDto>;
  updatePartsShortageStatus: (id: string, data: UpdatePartsShortageStatusRequest) => Promise<PartsShortageDto>;
  deletePartsShortage: (id: string) => Promise<void>;
  setCurrentPartsShortage: (partsShortage: PartsShortageDto | null) => void;
  getActiveShortages: () => PartsShortageDto[];
  clearError: () => void;
}

export const usePartsShortageStore = create<PartsShortageState>((set, get) => ({
  partsShortages: [],
  currentPartsShortage: null,
  loading: false,
  error: null,

  fetchPartsShortages: async () => {
    set({ loading: true, error: null });
    try {
      const data = await partsShortageApi.getPartsShortages();
      set({ partsShortages: data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取缺货列表失败', loading: false });
    }
  },

  fetchPartsShortage: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const partsShortage = await partsShortageApi.getPartsShortage(id);
      set({ currentPartsShortage: partsShortage, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取缺货详情失败', loading: false });
    }
  },

  createPartsShortage: async (data: CreatePartsShortageRequest) => {
    set({ loading: true, error: null });
    try {
      const newPartsShortage = await partsShortageApi.createPartsShortage(data);
      const { partsShortages } = get();
      set({ partsShortages: [newPartsShortage, ...partsShortages], loading: false });
      return newPartsShortage;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建缺货记录失败', loading: false });
      throw err;
    }
  },

  updatePartsShortageStatus: async (id: string, data: UpdatePartsShortageStatusRequest) => {
    set({ loading: true, error: null });
    try {
      const updated = await partsShortageApi.updatePartsShortageStatus(id, data);
      const { partsShortages, currentPartsShortage } = get();
      set({
        partsShortages: partsShortages.map(p => p.id === id ? updated : p),
        currentPartsShortage: currentPartsShortage?.id === id ? updated : currentPartsShortage,
        loading: false
      });
      return updated;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新缺货状态失败', loading: false });
      throw err;
    }
  },

  deletePartsShortage: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await partsShortageApi.deletePartsShortage(id);
      const { partsShortages, currentPartsShortage } = get();
      set({
        partsShortages: partsShortages.filter(p => p.id !== id),
        currentPartsShortage: currentPartsShortage?.id === id ? null : currentPartsShortage,
        loading: false
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除缺货记录失败', loading: false });
      throw err;
    }
  },

  setCurrentPartsShortage: (partsShortage) => {
    set({ currentPartsShortage: partsShortage });
  },

  getActiveShortages: () => {
    const { partsShortages } = get();
    return partsShortages.filter(p => p.status !== 'Resolved');
  },

  clearError: () => {
    set({ error: null });
  }
}));
