import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FilterDimensions,
  DateRange,
  ViewType,
  SavedView,
  AggregatedResult,
  ETLStatus,
  CacheStats,
  ETLPipelineStage,
  QueueTask,
} from '../types';
import { apiService } from '../services/apiService';
import { subDays, format } from 'date-fns';

interface AnalyticsState {
  filters: FilterDimensions;
  dateRange: DateRange;
  activeView: ViewType;
  savedViews: SavedView[];
  isLoading: boolean;
  isETLRunning: boolean;
  aggregatedResult: AggregatedResult | null;
  etlStatus: ETLStatus;
  cacheStats: CacheStats;
  pipelineStages: ETLPipelineStage[];
  tasks: QueueTask[];
  dataCapabilities: any[];
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
  cancelTask: (taskId: string) => Promise<boolean>;
  retryTask: (taskId: string) => Promise<boolean>;
  clearCompletedTasks: () => Promise<number>;
  clearCache: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  downloadExport: (taskId: string) => Promise<void>;
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

const initialETLStatus: ETLStatus = {
  lastUpdated: format(new Date(Date.now() - 30 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss'),
  status: 'success',
  nextRun: format(new Date(Date.now() + 60 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss'),
  recordsProcessed: 2456789,
};

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      filters: defaultFilters,
      dateRange: defaultDateRange,
      activeView: 'funnel',
      savedViews: [],
      isLoading: false,
      isETLRunning: false,
      aggregatedResult: null,
      etlStatus: initialETLStatus,
      cacheStats: { size: 0, hits: 0, misses: 0, hitRate: 0 },
      pipelineStages: [],
      tasks: [],
      dataCapabilities: [],

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

          const response = await apiService.queryAggregation(filters, dateRange);

          if (response.success && response.data) {
            set({
              aggregatedResult: response.data,
              isLoading: false,
            });

            const statsResponse = await apiService.getCacheStats();
            if (statsResponse.success && statsResponse.data) {
              set({ cacheStats: statsResponse.data });
            }

            const capResponse = await apiService.listCapabilities();
            if (capResponse.success && capResponse.data) {
              set({ dataCapabilities: capResponse.data });
            }

            await get().refreshTasks();
          } else {
            throw new Error(response.error?.message || '聚合查询失败');
          }
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
        const { filters, dateRange } = get();
        set({ isETLRunning: true });

        try {
          const response = await apiService.runETL(filters, dateRange, 'events_db', 'full');
          
          if (response.success && response.data) {
            const now = new Date();
            set({
              etlStatus: {
                lastUpdated: format(now, 'yyyy-MM-dd HH:mm:ss'),
                status: 'success',
                nextRun: format(new Date(now.getTime() + 60 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss'),
                recordsProcessed: Math.floor(2000000 + Math.random() * 1000000),
              },
              cacheStats: { size: 0, hits: 0, misses: 0, hitRate: 0 },
            });

            await get().fetchData();
          }
        } catch (error) {
          console.error('ETL failed:', error);
        } finally {
          set({ isETLRunning: false });
        }
      },

      exportData: async (format) => {
        const { aggregatedResult, filters, dateRange } = get();
        if (!aggregatedResult) return;

        try {
          const response = await apiService.createExport(
            aggregatedResult.queryId,
            format,
            filters,
            dateRange
          );

          if (response.success) {
            await get().refreshTasks();
          }
        } catch (error) {
          console.error('Export failed:', error);
        }
      },

      cancelTask: async (taskId) => {
        try {
          const response = await apiService.cancelTask(taskId);
          await get().refreshTasks();
          return response.success ? response.data! : false;
        } catch (error) {
          console.error('Cancel task failed:', error);
          return false;
        }
      },

      retryTask: async (taskId) => {
        try {
          const response = await apiService.retryTask(taskId);
          await get().refreshTasks();
          return response.success ? response.data! : false;
        } catch (error) {
          console.error('Retry task failed:', error);
          return false;
        }
      },

      clearCompletedTasks: async () => {
        try {
          const response = await apiService.clearCompletedTasks();
          await get().refreshTasks();
          return response.success ? (response.data?.cleared || 0) : 0;
        } catch (error) {
          console.error('Clear completed tasks failed:', error);
          return 0;
        }
      },

      clearCache: async () => {
        try {
          await apiService.clearCache();
          set({ cacheStats: { size: 0, hits: 0, misses: 0, hitRate: 0 } });
          await get().fetchData();
        } catch (error) {
          console.error('Clear cache failed:', error);
        }
      },

      refreshTasks: async () => {
        try {
          const response = await apiService.listTasks();
          if (response.success && response.data) {
            set({ tasks: response.data });
          }
        } catch (error) {
          console.error('Refresh tasks failed:', error);
        }
      },

      downloadExport: async (taskId) => {
        try {
          const blob = await apiService.downloadExport(taskId);
          const taskResponse = await apiService.getExportStatus(taskId);
          const task = taskResponse.data;
          
          if (task) {
            const format = ((task as any).type as string).replace('export_', '');
            const extMap: Record<string, string> = { csv: 'csv', xlsx: 'xlsx', pdf: 'pdf' };
            const mimeMap: Record<string, string> = {
              csv: 'text/csv;charset=utf-8',
              xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              pdf: 'application/pdf',
            };
            
            const a = document.createElement('a');
            const url = URL.createObjectURL(blob);
            a.href = url;
            a.download = `留存分析报告_${Date.now()}.${extMap[format]}`;
            a.type = mimeMap[format];
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 60000);
          }
        } catch (error) {
          console.error('Download export failed:', error);
        }
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
