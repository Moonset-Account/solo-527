import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, FilterState, FilterPreset } from '../../shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isCoach: () => boolean;
  isAthlete: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isCoach: () => get().user?.role === 'coach',
      isAthlete: () => get().user?.role === 'athlete',
    }),
    { name: 'auth-storage' }
  )
);

const getDefaultFilterState = (): FilterState => ({
  athleteIds: [],
  sports: [],
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  timeWindow: 'week',
  exercises: [],
  metrics: ['loadScore', 'avgHeartRate'],
});

interface FilterStore {
  filters: FilterState;
  presets: FilterPreset[];
  setAthletes: (ids: string[]) => void;
  setSports: (sports: string[]) => void;
  setDateRange: (start: string, end: string) => void;
  setTimeWindow: (window: FilterState['timeWindow']) => void;
  setExercises: (exercises: string[]) => void;
  setMetrics: (metrics: string[]) => void;
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      filters: getDefaultFilterState(),
      presets: [],
      setAthletes: (ids) =>
        set((state) => ({ filters: { ...state.filters, athleteIds: ids } })),
      setSports: (sports) =>
        set((state) => ({ filters: { ...state.filters, sports } })),
      setDateRange: (start, end) =>
        set((state) => ({
          filters: { ...state.filters, dateRange: { start, end } },
        })),
      setTimeWindow: (window) =>
        set((state) => ({ filters: { ...state.filters, timeWindow: window } })),
      setExercises: (exercises) =>
        set((state) => ({ filters: { ...state.filters, exercises } })),
      setMetrics: (metrics) =>
        set((state) => ({ filters: { ...state.filters, metrics } })),
      savePreset: (name) => {
        const newPreset: FilterPreset = {
          id: `preset-${Date.now()}`,
          name,
          userId: useAuthStore.getState().user?.id || 'anonymous',
          isDefault: false,
          filters: { ...get().filters },
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ presets: [...state.presets, newPreset] }));
      },
      loadPreset: (id) => {
        const preset = get().presets.find((p) => p.id === id);
        if (preset) {
          set({ filters: { ...preset.filters } });
        }
      },
      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),
      resetFilters: () => set({ filters: getDefaultFilterState() }),
    }),
    { name: 'filter-storage' }
  )
);

interface UIState {
  sidebarOpen: boolean;
  dataQualityBannerOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setDataQualityBannerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  dataQualityBannerOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setDataQualityBannerOpen: (open) => set({ dataQualityBannerOpen: open }),
}));
