import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterCriteria, User, HazardStatus, HazardLevel } from '@/types';

interface FilterState {
  criteria: FilterCriteria;
  setDateRange: (range: [string, string] | undefined) => void;
  setFloors: (floors: number[]) => void;
  setTeamIds: (teamIds: string[]) => void;
  setTypeIds: (typeIds: string[]) => void;
  setStatuses: (statuses: HazardStatus[]) => void;
  setLevels: (levels: HazardLevel[]) => void;
  setKeyword: (keyword: string) => void;
  setCriteria: (criteria: FilterCriteria) => void;
  resetFilters: () => void;
  toggleFloor: (floor: number) => void;
  toggleTeam: (teamId: string) => void;
  toggleType: (typeId: string) => void;
  toggleStatus: (status: HazardStatus) => void;
  toggleLevel: (level: HazardLevel) => void;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

interface UIState {
  selectedHazardId: string | null;
  isDetailPanelOpen: boolean;
  setSelectedHazardId: (id: string | null) => void;
  setDetailPanelOpen: (open: boolean) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      criteria: {},
      setDateRange: (range) =>
        set((state) => ({
          criteria: { ...state.criteria, dateRange: range },
        })),
      setFloors: (floors) =>
        set((state) => ({
          criteria: { ...state.criteria, floors },
        })),
      setTeamIds: (teamIds) =>
        set((state) => ({
          criteria: { ...state.criteria, teamIds },
        })),
      setTypeIds: (typeIds) =>
        set((state) => ({
          criteria: { ...state.criteria, typeIds },
        })),
      setStatuses: (statuses) =>
        set((state) => ({
          criteria: { ...state.criteria, statuses },
        })),
      setLevels: (levels) =>
        set((state) => ({
          criteria: { ...state.criteria, levels },
        })),
      setKeyword: (keyword) =>
        set((state) => ({
          criteria: { ...state.criteria, keyword },
        })),
      setCriteria: (criteria) => set({ criteria }),
      resetFilters: () => set({ criteria: {} }),
      toggleFloor: (floor) => {
        const current = get().criteria.floors || [];
        const next = current.includes(floor)
          ? current.filter((f) => f !== floor)
          : [...current, floor];
        set((state) => ({
          criteria: { ...state.criteria, floors: next },
        }));
      },
      toggleTeam: (teamId) => {
        const current = get().criteria.teamIds || [];
        const next = current.includes(teamId)
          ? current.filter((t) => t !== teamId)
          : [...current, teamId];
        set((state) => ({
          criteria: { ...state.criteria, teamIds: next },
        }));
      },
      toggleType: (typeId) => {
        const current = get().criteria.typeIds || [];
        const next = current.includes(typeId)
          ? current.filter((t) => t !== typeId)
          : [...current, typeId];
        set((state) => ({
          criteria: { ...state.criteria, typeIds: next },
        }));
      },
      toggleStatus: (status) => {
        const current = get().criteria.statuses || [];
        const next = current.includes(status)
          ? current.filter((s) => s !== status)
          : [...current, status];
        set((state) => ({
          criteria: { ...state.criteria, statuses: next },
        }));
      },
      toggleLevel: (level) => {
        const current = get().criteria.levels || [];
        const next = current.includes(level)
          ? current.filter((l) => l !== level)
          : [...current, level];
        set((state) => ({
          criteria: { ...state.criteria, levels: next },
        }));
      },
    }),
    {
      name: 'filter-storage',
      partialize: (state) => ({ criteria: state.criteria }),
    }
  )
);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useUIStore = create<UIState>((set) => ({
  selectedHazardId: null,
  isDetailPanelOpen: false,
  setSelectedHazardId: (id) => set({ selectedHazardId: id }),
  setDetailPanelOpen: (open) => set({ isDetailPanelOpen: open }),
}));
