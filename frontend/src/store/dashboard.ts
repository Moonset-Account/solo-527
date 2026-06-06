import { create } from 'zustand';
import { FilterState, ChartDataResponse, FilterOptions, SavedView } from '../types';
import { api } from '../services/api';

interface DashboardStore {
  filters: FilterState;
  filterOptions: FilterOptions | null;
  dashboardData: ChartDataResponse | null;
  savedViews: SavedView[];
  loading: boolean;
  error: string | null;
  drillDownFilters: FilterState;
  activeDrillDown: string | null;

  setFilters: (filters: Partial<FilterState>, autoFetch?: boolean) => void;
  resetFilters: () => void;
  setDrillDown: (dimension: string | null, filters?: FilterState) => void;
  fetchFilterOptions: () => Promise<void>;
  fetchDashboardData: () => Promise<void>;
  fetchSavedViews: () => Promise<void>;
  saveCurrentView: (name: string, isPublic?: boolean) => Promise<void>;
  deleteView: (id: number) => Promise<void>;
  loadView: (view: SavedView) => void;
}

const defaultFilters: FilterState = {};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  filters: defaultFilters,
  filterOptions: null,
  dashboardData: null,
  savedViews: [],
  loading: false,
  error: null,
  drillDownFilters: {},
  activeDrillDown: null,

  setFilters: (newFilters, autoFetch = true) => {
    const merged = { ...get().filters, ...newFilters };
    Object.keys(merged).forEach(key => {
      if (merged[key as keyof FilterState] === undefined ||
          merged[key as keyof FilterState] === null ||
          (Array.isArray(merged[key as keyof FilterState]) && merged[key as keyof FilterState]?.length === 0)) {
        delete merged[key as keyof FilterState];
      }
    });
    set({ filters: merged });
    if (autoFetch) {
      get().fetchDashboardData();
    }
  },

  resetFilters: () => {
    set({ filters: defaultFilters, activeDrillDown: null, drillDownFilters: {} });
    get().fetchDashboardData();
  },

  setDrillDown: (dimension, filters) => {
    if (dimension === null) {
      set({ activeDrillDown: null, drillDownFilters: {} });
    } else {
      set({ activeDrillDown: dimension, drillDownFilters: filters || {} });
    }
    get().fetchDashboardData();
  },

  fetchFilterOptions: async () => {
    try {
      const data = await api.getFilterOptions();
      set({ filterOptions: data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, drillDownFilters, activeDrillDown } = get();
      const effectiveFilters = activeDrillDown
        ? { ...filters, ...drillDownFilters }
        : filters;
      const data = await api.getDashboardData(effectiveFilters);
      set({ dashboardData: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSavedViews: async () => {
    try {
      const data = await api.getSavedViews();
      set({ savedViews: data });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  saveCurrentView: async (name, isPublic = false) => {
    try {
      const { filters, drillDownFilters, activeDrillDown } = get();
      const effectiveFilters = activeDrillDown
        ? { ...filters, ...drillDownFilters }
        : filters;
      await api.saveView(name, effectiveFilters, isPublic);
      await get().fetchSavedViews();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteView: async (id) => {
    try {
      await api.deleteView(id);
      await get().fetchSavedViews();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  loadView: (view) => {
    set({ filters: view.filters, activeDrillDown: null, drillDownFilters: {} });
    get().fetchDashboardData();
  }
}));
