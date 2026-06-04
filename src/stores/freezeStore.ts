import { create } from 'zustand';
import type { Freeze } from '../../shared/types';
import { freezeApi } from '@/utils/api';

interface FreezeState {
  freezes: Freeze[];
  loading: boolean;
  error: string | null;
  fetchFreezes: (filters?: { member_id?: number; status?: string }) => Promise<void>;
  createFreeze: (data: Partial<Freeze>) => Promise<Freeze>;
  approveFreeze: (id: number) => Promise<void>;
  rejectFreeze: (id: number) => Promise<void>;
  fetchMemberFreezes: (memberId: number) => Promise<void>;
}

export const useFreezeStore = create<FreezeState>((set) => ({
  freezes: [],
  loading: false,
  error: null,
  fetchFreezes: async (filters?: { member_id?: number; status?: string }) => {
    set({ loading: true, error: null });
    try {
      const freezes = await freezeApi.list(filters);
      set({ freezes, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  createFreeze: async (data: Partial<Freeze>) => {
    const freeze = await freezeApi.create(data);
    set((s) => ({ freezes: [...s.freezes, freeze] }));
    return freeze;
  },
  approveFreeze: async (id: number) => {
    const freeze = await freezeApi.approve(id);
    set((s) => ({ freezes: s.freezes.map((f) => (f.id === id ? freeze : f)) }));
  },
  rejectFreeze: async (id: number) => {
    const freeze = await freezeApi.reject(id);
    set((s) => ({ freezes: s.freezes.map((f) => (f.id === id ? freeze : f)) }));
  },
  fetchMemberFreezes: async (memberId: number) => {
    try {
      const freezes = await freezeApi.getMemberFreezes(memberId);
      set({ freezes });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
