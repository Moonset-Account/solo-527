'use client';

import { create } from 'zustand';
import type { Match } from '@/lib/types';

interface ScheduleFilters {
  round?: number;
  teamId?: string;
  venueId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

interface ScheduleState {
  matches: Match[];
  selectedDate: Date | null;
  filters: ScheduleFilters;
  loading: boolean;
  error: string | null;
  fetchMatches: (filters?: ScheduleFilters) => Promise<void>;
  getMatchById: (id: string) => Match | undefined;
  updateMatchScore: (matchId: string, score: { homeScore: number; awayScore: number }) => Promise<void>;
  setSelectedDate: (date: Date | null) => void;
  setFilters: (filters: Partial<ScheduleFilters>) => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  matches: [],
  selectedDate: null,
  filters: {},
  loading: false,
  error: null,

  fetchMatches: async (filters?: ScheduleFilters) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }
      
      const res = await fetch(`/api/matches?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        set({ matches: data.data || [], loading: false });
      } else {
        set({ error: data.message || '获取赛程失败', loading: false });
      }
    } catch {
      set({ error: '网络错误，请稍后重试', loading: false });
    }
  },

  getMatchById: (id: string) => {
    return get().matches.find(m => m._id === id);
  },

  updateMatchScore: async (matchId: string, score: { homeScore: number; awayScore: number }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/matches/${matchId}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(score),
      });
      const data = await res.json();
      
      if (data.success) {
        set(state => ({
          matches: state.matches.map(m => 
            m._id === matchId ? { ...m, ...score, status: 'LIVE' as const } : m
          ),
          loading: false
        }));
      } else {
        set({ error: data.message || '更新比分失败', loading: false });
      }
    } catch {
      set({ error: '网络错误，请稍后重试', loading: false });
    }
  },

  setSelectedDate: (date: Date | null) => {
    set({ selectedDate: date });
  },

  setFilters: (filters: Partial<ScheduleFilters>) => {
    set(state => ({ filters: { ...state.filters, ...filters } }));
  },
}));
