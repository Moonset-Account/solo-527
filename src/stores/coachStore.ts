import { create } from 'zustand';
import type { Coach, Schedule } from '../../shared/types';
import { coachApi } from '@/utils/api';

interface CoachState {
  coaches: Coach[];
  currentCoach: Coach | null;
  performance: { sessions: number; revenue: number } | null;
  schedule: Schedule[];
  loading: boolean;
  error: string | null;
  fetchCoaches: (status?: string) => Promise<void>;
  fetchCoach: (id: number) => Promise<void>;
  createCoach: (data: Partial<Coach>) => Promise<Coach>;
  updateCoach: (id: number, data: Partial<Coach>) => Promise<Coach>;
  fetchPerformance: (id: number) => Promise<void>;
  fetchSchedule: (id: number, startDate?: string, endDate?: string) => Promise<void>;
  clearCurrent: () => void;
}

export const useCoachStore = create<CoachState>((set) => ({
  coaches: [],
  currentCoach: null,
  performance: null,
  schedule: [],
  loading: false,
  error: null,
  fetchCoaches: async (status?: string) => {
    set({ loading: true, error: null });
    try {
      const coaches = await coachApi.list(status);
      set({ coaches, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  fetchCoach: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const coach = await coachApi.get(id);
      set({ currentCoach: coach, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  createCoach: async (data: Partial<Coach>) => {
    const coach = await coachApi.create(data);
    set((s) => ({ coaches: [...s.coaches, coach] }));
    return coach;
  },
  updateCoach: async (id: number, data: Partial<Coach>) => {
    const coach = await coachApi.update(id, data);
    set((s) => ({
      coaches: s.coaches.map((c) => (c.id === id ? coach : c)),
      currentCoach: s.currentCoach?.id === id ? coach : s.currentCoach,
    }));
    return coach;
  },
  fetchPerformance: async (id: number) => {
    try {
      const perf = await coachApi.getPerformance(id);
      set({ performance: perf });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
  fetchSchedule: async (id: number, startDate?: string, endDate?: string) => {
    try {
      const schedule = await coachApi.getSchedule(id, startDate, endDate);
      set({ schedule });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
  clearCurrent: () => set({ currentCoach: null, performance: null, schedule: [] }),
}));
