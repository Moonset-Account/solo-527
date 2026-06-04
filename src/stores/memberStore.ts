import { create } from 'zustand';
import type { Member } from '../../shared/types';
import { memberApi } from '@/utils/api';

interface MemberState {
  members: Member[];
  currentMember: Member | null;
  loading: boolean;
  error: string | null;
  fetchMembers: (status?: string) => Promise<void>;
  fetchMember: (id: number) => Promise<void>;
  createMember: (data: Partial<Member>) => Promise<Member>;
  updateMember: (id: number, data: Partial<Member>) => Promise<Member>;
  deleteMember: (id: number) => Promise<void>;
  clearCurrent: () => void;
}

export const useMemberStore = create<MemberState>((set) => ({
  members: [],
  currentMember: null,
  loading: false,
  error: null,
  fetchMembers: async (status?: string) => {
    set({ loading: true, error: null });
    try {
      const members = await memberApi.list(status);
      set({ members, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  fetchMember: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const member = await memberApi.get(id);
      set({ currentMember: member, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  createMember: async (data: Partial<Member>) => {
    const member = await memberApi.create(data);
    set((s) => ({ members: [...s.members, member] }));
    return member;
  },
  updateMember: async (id: number, data: Partial<Member>) => {
    const member = await memberApi.update(id, data);
    set((s) => ({
      members: s.members.map((m) => (m.id === id ? member : m)),
      currentMember: s.currentMember?.id === id ? member : s.currentMember,
    }));
    return member;
  },
  deleteMember: async (id: number) => {
    await memberApi.remove(id);
    set((s) => ({
      members: s.members.filter((m) => m.id !== id),
      currentMember: s.currentMember?.id === id ? null : s.currentMember,
    }));
  },
  clearCurrent: () => set({ currentMember: null }),
}));
