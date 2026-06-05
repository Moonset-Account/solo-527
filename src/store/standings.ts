'use client';

import { create } from 'zustand';
import type { Standing } from '@/lib/types';

interface StandingState {
  standings: Standing[];
  seasonId: string | null;
  loading: boolean;
  error: string | null;
  fetchStandings: (seasonId?: string) => Promise<void>;
  recalculateStandings: (seasonId: string) => Promise<void>;
}

export const useStandingStore = create<StandingState>((set) => ({
  standings: [],
  seasonId: null,
  loading: false,
  error: null,

  fetchStandings: async (seasonId?: string) => {
    set({ loading: true, error: null });
    try {
      const params = seasonId ? `?seasonId=${seasonId}` : '';
      const res = await fetch(`/api/standings${params}`);
      const data = await res.json();
      
      if (data.success) {
        set({ 
          standings: data.data || [], 
          seasonId: seasonId || null,
          loading: false 
        });
      } else {
        set({ error: data.message || '获取积分榜失败', loading: false });
      }
    } catch {
      set({ error: '网络错误，请稍后重试', loading: false });
    }
  },

  recalculateStandings: async (seasonId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/standings/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId }),
      });
      const data = await res.json();
      
      if (data.success) {
        set({ standings: data.data || [], loading: false });
      } else {
        set({ error: data.message || '重新计算失败', loading: false });
      }
    } catch {
      set({ error: '网络错误，请稍后重试', loading: false });
    }
  },
}));
