import { create } from 'zustand';
import type { MeasurementQuery, DataSource } from '../types';

interface FilterState {
  query: MeasurementQuery;
  selectedIndicators: string[];
  setQuery: (query: Partial<MeasurementQuery>) => void;
  setSelectedIndicators: (indicators: string[]) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  query: {
    dataSource: 'all',
  },
  selectedIndicators: ['temperature', 'ph', 'dissolvedOxygen', 'ammoniaNitrogen'],
  setQuery: (newQuery) =>
    set((state) => ({
      query: { ...state.query, ...newQuery },
    })),
  setSelectedIndicators: (indicators) =>
    set(() => ({
      selectedIndicators: indicators,
    })),
  resetFilters: () =>
    set(() => ({
      query: { dataSource: 'all' },
      selectedIndicators: ['temperature', 'ph', 'dissolvedOxygen', 'ammoniaNitrogen'],
    })),
}));

interface AuthState {
  user: {
    id: string;
    username: string;
    role: 'admin' | 'researcher';
    organization: string;
  } | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'user-1',
    username: 'admin',
    role: 'admin',
    organization: '市环境监测中心站',
  },
  isAuthenticated: true,
  login: (username, password) => {
    if (username && password) {
      set({
        user: {
          id: 'user-1',
          username,
          role: username === 'admin' ? 'admin' : 'researcher',
          organization: '市环境监测中心站',
        },
        isAuthenticated: true,
      });
      return true;
    }
    return false;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
