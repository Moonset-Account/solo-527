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
  ETLStatus,
  ExportTask,
} from '../types';
import { apiService, etlEngine, exportService, dataCache } from '../services/apiService';
import { subDays, format } from 'date-fns';

interface AnalyticsState {
  filters: FilterDimensions;
  dateRange: DateRange;
  activeView: ViewType;
  savedViews: SavedView[];
  isLoading: boolean;
  isExporting: boolean;
  funnelData: FunnelData | null;
  cohortData: CohortData | null;
  featureData: FeatureUsage[] | null;
  pathData: PathData | null;
  churnReasons: ChurnReason[] | null;
  etlStatus: ETLStatus;
  exportTasks: ExportTask[];
  cacheStats: { size: number };
  setFilters: (filters: Partial<FilterDimensions>) => void;
  setDateRange: (range: DateRange) => void;
  setActiveView: (view: ViewType) => void;
  saveView: (name: string) => void;
  loadView: (viewId: string) => void;
  deleteView: (viewId: string) => void;
  fetchData: () => Promise<void>;
  resetFilters: () => void;
  runETL: () => Promise<void>;
  exportData: (format: 'csv' | 'xlsx' | 'pdf') => Promise<void>;
  refreshCacheStats: () => void;
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
      isExporting: false,
      funnelData: null,
      cohortData: null,
      featureData: null,
      pathData: null,
      churnReasons: null,
      etlStatus: etlEngine.getStatus(),
      exportTasks: [],
      cacheStats: { size: 0 },

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
        try {
          const { filters, dateRange } = get();
          const data = await apiService.fetchAllData(filters, dateRange);
          set({
            funnelData: data.funnel,
            cohortData: data.cohort,
            featureData: data.features,
            pathData: data.paths,
            churnReasons: data.churn,
            isLoading: false,
          });
          get().refreshCacheStats();
        } catch (error) {
          console.error('Failed to fetch data:', error);
          set({ isLoading: false });
        }
      },

      resetFilters: () => {
        set({ filters: defaultFilters, dateRange: defaultDateRange });
        get().fetchData();
      },

      runETL: async () => {
        set((state) => ({
          etlStatus: { ...state.etlStatus, status: 'running' },
        }));
        const newStatus = await etlEngine.runETL();
        set({ etlStatus: newStatus });
        await get().fetchData();
      },

      exportData: async (format) => {
        set({ isExporting: true });
        try {
          const { filters, dateRange, activeView } = get();
          const task = await exportService.createExport(filters, dateRange, format, activeView);
          set((state) => ({
            exportTasks: [task, ...state.exportTasks],
          }));
          
          const checkInterval = setInterval(() => {
            const updated = exportService.getTasks();
            set({ exportTasks: updated });
            if (updated[0]?.status === 'completed' || updated[0]?.status === 'failed') {
              clearInterval(checkInterval);
              set({ isExporting: false });
            }
          }, 500);
        } catch (error) {
          console.error('Export failed:', error);
          set({ isExporting: false });
        }
      },

      refreshCacheStats: () => {
        set({ cacheStats: { size: dataCache.size } });
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
