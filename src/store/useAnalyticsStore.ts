import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FilterDimensions,
  DateRange,
  ViewType,
  SavedView,
  FunnelData,
  CohortData,
  FeatureUsage,
  PathData,
  ChurnReason,
} from '../types';
import {
  generateFunnelData,
  generateCohortData,
  generateFeatureUsage,
  generatePathData,
  generateChurnReasons,
} from '../data/mockData';
import { subDays, format } from 'date-fns';

interface AnalyticsState {
  filters: FilterDimensions;
  dateRange: DateRange;
  activeView: ViewType;
  savedViews: SavedView[];
  isLoading: boolean;
  funnelData: FunnelData | null;
  cohortData: CohortData | null;
  featureData: FeatureUsage[] | null;
  pathData: PathData | null;
  churnReasons: ChurnReason[] | null;
  setFilters: (filters: Partial<FilterDimensions>) => void;
  setDateRange: (range: DateRange) => void;
  setActiveView: (view: ViewType) => void;
  saveView: (name: string) => void;
  loadView: (viewId: string) => void;
  deleteView: (viewId: string) => void;
  fetchData: () => Promise<void>;
  resetFilters: () => void;
}

const defaultFilters: FilterDimensions = {
  users: [],
  teams: [],
  channels: [],
  versions: [],
  modules: [],
  trafficType: 'all',
};

const defaultDateRange: DateRange = {
  start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  end: format(new Date(), 'yyyy-MM-dd'),
};

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      filters: defaultFilters,
      dateRange: defaultDateRange,
      activeView: 'funnel',
      savedViews: [],
      isLoading: false,
      funnelData: null,
      cohortData: null,
      featureData: null,
      pathData: null,
      churnReasons: null,

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
        get().fetchData();
      },

      setDateRange: (range) => {
        set({ dateRange: range });
        get().fetchData();
      },

      setActiveView: (view) => {
        set({ activeView: view });
      },

      saveView: (name) => {
        const state = get();
        const newView: SavedView = {
          id: `view_${Date.now()}`,
          name,
          createdAt: new Date().toISOString(),
          filters: { ...state.filters },
          dateRange: { ...state.dateRange },
          activeView: state.activeView,
        };
        set((state) => ({
          savedViews: [...state.savedViews, newView],
        }));
      },

      loadView: (viewId) => {
        const view = get().savedViews.find((v) => v.id === viewId);
        if (view) {
          set({
            filters: view.filters,
            dateRange: view.dateRange,
            activeView: view.activeView,
          });
          get().fetchData();
        }
      },

      deleteView: (viewId) => {
        set((state) => ({
          savedViews: state.savedViews.filter((v) => v.id !== viewId),
        }));
      },

      fetchData: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));
        const filters = get().filters;
        set({
          funnelData: generateFunnelData(filters),
          cohortData: generateCohortData(),
          featureData: generateFeatureUsage(),
          pathData: generatePathData(),
          churnReasons: generateChurnReasons(),
          isLoading: false,
        });
      },

      resetFilters: () => {
        set({ filters: defaultFilters, dateRange: defaultDateRange });
        get().fetchData();
      },
    }),
    {
      name: 'analytics-dashboard-storage',
      partialize: (state) => ({
        filters: state.filters,
        dateRange: state.dateRange,
        activeView: state.activeView,
        savedViews: state.savedViews,
      }),
    }
  )
);
