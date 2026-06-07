import { create } from 'zustand';
import type { MeasurementQuery, DataSource, User } from '../types';
import { api } from '../utils/apiClient';

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
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await api.auth.login(username, password);

      if (result.success && result.data) {
        const { user, token } = result.data as { user: User; token: string };
        api.setToken(token);
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({
          error: result.error || '登录失败',
          isLoading: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: '网络错误，请稍后重试',
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    api.clearToken();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export function initAuthFromStorage() {
  const token = api.getToken();
  if (token) {
    api.auth.me().then((result) => {
      if (!result.success) {
        api.clearToken();
      }
    });
  }
}
