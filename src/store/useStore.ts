import { create } from 'zustand';
import type { FilterParams, FilterOptions } from '@/types';

interface AppState {
  filters: FilterParams;
  sampleThreshold: number;
  filterOptions: FilterOptions | null;
  selectedDishId: string | null;
  returnDrillReason: string | null;
  setFilters: (filters: Partial<FilterParams>) => void;
  resetFilters: () => void;
  setSampleThreshold: (threshold: number) => void;
  setFilterOptions: (options: FilterOptions) => void;
  setSelectedDishId: (id: string | null) => void;
  setReturnDrillReason: (reason: string | null) => void;
}

const defaultFilters: FilterParams = {};

export const useStore = create<AppState>((set) => ({
  filters: { ...defaultFilters },
  sampleThreshold: 30,
  filterOptions: null,
  selectedDishId: null,
  returnDrillReason: null,
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  setSampleThreshold: (threshold) => set({ sampleThreshold: threshold }),
  setFilterOptions: (options) => set({ filterOptions: options }),
  setSelectedDishId: (id) => set({ selectedDishId: id }),
  setReturnDrillReason: (reason) => set({ returnDrillReason: reason }),
}));
