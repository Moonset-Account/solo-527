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
import { etlEngine, CleanStats } from '../services/etlEngine';
import { taskQueue } from '../services/taskQueue';
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
  cleanStats: CleanStats | null;
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
  exportData: (format: 'csv' | 'xlsx' | 'pdf') => void;
  cancelTask: (taskId: string) => boolean;
  retryTask: (taskId: string) => boolean;
  clearCompletedTasks: () => number;
  clearCache: () => Promise<void>;
  refreshTasks: () => void;
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

const cache = new Map<string, { data: AggregatedResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const generateCacheKey = (filters: FilterDimensions, dateRange: DateRange): string => {
  return [
    dateRange.start,
    dateRange.end,
    filters.users.sort().join(','),
    filters.teams.sort().join(','),
    filters.channels.sort().join(','),
    filters.versions.sort().join(','),
    filters.modules.sort().join(','),
    filters.trafficType,
  ].join('|');
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
      cleanStats: null,
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
          const { filters, dateRange, cacheStats } = get();
          const cacheKey = generateCacheKey(filters, dateRange);
          const cached = cache.get(cacheKey);

          if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            set({
              aggregatedResult: cached.data,
              isLoading: false,
              cacheStats: {
                ...cacheStats,
                hits: cacheStats.hits + 1,
                hitRate: Math.round(((cacheStats.hits + 1) / (cacheStats.hits + cacheStats.misses + 1)) * 10000) / 100,
                size: cache.size,
              },
            });
            return;
          }

          const { result, stages, stats } = await etlEngine.runFullPipeline(
            filters,
            dateRange,
            (stage, progress, message) => {
              console.log(`[ETL] ${stage}: ${progress}% - ${message}`);
            }
          );

          cache.set(cacheKey, { data: result, timestamp: Date.now() });
          
          if (cache.size > 50) {
            const oldestKey = cache.keys().next().value;
            if (oldestKey) cache.delete(oldestKey);
          }

          set({
            aggregatedResult: result,
            pipelineStages: stages,
            cleanStats: stats,
            isLoading: false,
            cacheStats: {
              ...cacheStats,
              misses: cacheStats.misses + 1,
              hitRate: Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses + 1)) * 10000) / 100,
              size: cache.size,
            },
          });

          apiService.listCapabilities().then(res => {
            if (res.success && res.data) {
              set({ dataCapabilities: res.data });
            }
          });

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

        taskQueue.createTask(
          'etl',
          '全量 ETL 数据同步',
          { filters, dateRange, source: 'events_db', mode: 'full' },
          'high'
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        cache.clear();
        set({
          etlStatus: {
            ...get().etlStatus,
            status: 'running',
          },
          cacheStats: { size: 0, hits: 0, misses: 0, hitRate: 0 },
        });

        await get().fetchData();

        const now = new Date();
        set({
          isETLRunning: false,
          etlStatus: {
            lastUpdated: format(now, 'yyyy-MM-dd HH:mm:ss'),
            status: 'success',
            nextRun: format(new Date(now.getTime() + 60 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss'),
            recordsProcessed: Math.floor(2000000 + Math.random() * 1000000),
          },
        });
      },

      exportData: (format) => {
        const { aggregatedResult, filters, dateRange } = get();
        if (!aggregatedResult) return;

        const taskType = `export_${format}` as const;
        const formatNames = { csv: 'CSV', xlsx: 'Excel', pdf: 'PDF' };
        
        taskQueue.createTask(
          taskType,
          `导出 ${formatNames[format]} 报告`,
          {
            queryId: aggregatedResult.queryId,
            aggregatedResult,
            filters,
            dateRange,
          },
          'medium'
        );

        get().refreshTasks();
      },

      cancelTask: (taskId) => {
        const result = taskQueue.cancelTask(taskId);
        get().refreshTasks();
        return result;
      },

      retryTask: (taskId) => {
        const result = taskQueue.retryTask(taskId);
        get().refreshTasks();
        return result;
      },

      clearCompletedTasks: () => {
        const count = taskQueue.clearCompleted();
        get().refreshTasks();
        return count;
      },

      clearCache: async () => {
        cache.clear();
        set({ cacheStats: { size: 0, hits: 0, misses: 0, hitRate: 0 } });
        await get().fetchData();
      },

      refreshTasks: () => {
        set({ tasks: taskQueue.getTasks() });
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

taskQueue.subscribe((tasks) => {
  const state = useAnalyticsStore.getState();
  if (JSON.stringify(state.tasks) !== JSON.stringify(tasks)) {
    useAnalyticsStore.setState({ tasks });
  }
});
