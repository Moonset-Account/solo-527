import { create } from 'zustand';
import type {
  FilterParams,
  ViewPerspective,
  Anomaly,
  FunnelResponse,
  ChannelQualityResponse,
  ConsultantLoadResponse,
  FollowUpTrendResponse,
  FilterOption,
  ExportTask,
  ExportFormat,
} from '../../shared/types';
import {
  fetchAnomalies,
  fetchFunnel,
  fetchChannelQuality,
  fetchConsultantLoad,
  fetchFollowUpTrend,
  fetchFilterOptions,
  submitExport as apiSubmitExport,
  fetchExportTasks as apiFetchExportTasks,
} from '@/lib/api';

interface FilterOptions {
  projects: FilterOption[];
  consultants: FilterOption[];
  channels: FilterOption[];
  stages: string[];
  months: string[];
}

interface LoadingStates {
  anomalies: boolean;
  funnel: boolean;
  channelQuality: boolean;
  consultantLoad: boolean;
  followUpTrend: boolean;
  filterOptions: boolean;
  exportSubmit: boolean;
  exportTasks: boolean;
}

interface ErrorStates {
  anomalies: string | null;
  funnel: string | null;
  channelQuality: string | null;
  consultantLoad: string | null;
  followUpTrend: string | null;
  filterOptions: string | null;
  exportSubmit: string | null;
  exportTasks: string | null;
}

interface DashboardState {
  filterParams: FilterParams;
  perspective: ViewPerspective;
  anomalies: Anomaly[];
  funnelData: FunnelResponse | null;
  channelData: ChannelQualityResponse | null;
  consultantData: ConsultantLoadResponse | null;
  followUpData: FollowUpTrendResponse | null;
  filterOptions: FilterOptions;
  exportTasks: ExportTask[];
  loading: LoadingStates;
  errors: ErrorStates;

  setFilter: (params: Partial<FilterParams>) => void;
  setPerspective: (perspective: ViewPerspective) => void;
  resetFilters: () => void;
  fetchAnomaliesData: () => Promise<void>;
  fetchFunnelData: () => Promise<void>;
  fetchChannelQualityData: () => Promise<void>;
  fetchConsultantLoadData: () => Promise<void>;
  fetchFollowUpTrendData: () => Promise<void>;
  fetchFilterOptionsData: () => Promise<void>;
  submitExport: (viewType: string, format: ExportFormat) => Promise<void>;
  fetchExportTasksData: () => Promise<void>;
}

const initialFilterParams: FilterParams = {};

const initialFilterOptions: FilterOptions = {
  projects: [],
  consultants: [],
  channels: [],
  stages: [],
  months: [],
};

const initialLoading: LoadingStates = {
  anomalies: false,
  funnel: false,
  channelQuality: false,
  consultantLoad: false,
  followUpTrend: false,
  filterOptions: false,
  exportSubmit: false,
  exportTasks: false,
};

const initialErrors: ErrorStates = {
  anomalies: null,
  funnel: null,
  channelQuality: null,
  consultantLoad: null,
  followUpTrend: null,
  filterOptions: null,
  exportSubmit: null,
  exportTasks: null,
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  filterParams: initialFilterParams,
  perspective: 'project',
  anomalies: [],
  funnelData: null,
  channelData: null,
  consultantData: null,
  followUpData: null,
  filterOptions: initialFilterOptions,
  exportTasks: [],
  loading: initialLoading,
  errors: initialErrors,

  setFilter: (params) =>
    set((state) => ({
      filterParams: { ...state.filterParams, ...params },
    })),

  setPerspective: (perspective) => set({ perspective }),

  resetFilters: () => set({ filterParams: initialFilterParams }),

  fetchAnomaliesData: async () => {
    set((state) => ({ loading: { ...state.loading, anomalies: true }, errors: { ...state.errors, anomalies: null } }));
    try {
      const { filterParams } = get();
      const response = await fetchAnomalies(filterParams);
      set({ anomalies: response.anomalies, loading: { ...get().loading, anomalies: false } });
    } catch (error) {
      set({
        loading: { ...get().loading, anomalies: false },
        errors: { ...get().errors, anomalies: error instanceof Error ? error.message : 'Failed to fetch anomalies' },
      });
    }
  },

  fetchFunnelData: async () => {
    set((state) => ({ loading: { ...state.loading, funnel: true }, errors: { ...state.errors, funnel: null } }));
    try {
      const { filterParams } = get();
      const response = await fetchFunnel(filterParams);
      set({ funnelData: response, loading: { ...get().loading, funnel: false } });
    } catch (error) {
      set({
        loading: { ...get().loading, funnel: false },
        errors: { ...get().errors, funnel: error instanceof Error ? error.message : 'Failed to fetch funnel data' },
      });
    }
  },

  fetchChannelQualityData: async () => {
    set((state) => ({ loading: { ...state.loading, channelQuality: true }, errors: { ...state.errors, channelQuality: null } }));
    try {
      const { filterParams } = get();
      const response = await fetchChannelQuality(filterParams);
      set({ channelData: response, loading: { ...get().loading, channelQuality: false } });
    } catch (error) {
      set({
        loading: { ...get().loading, channelQuality: false },
        errors: { ...get().errors, channelQuality: error instanceof Error ? error.message : 'Failed to fetch channel quality' },
      });
    }
  },

  fetchConsultantLoadData: async () => {
    set((state) => ({ loading: { ...state.loading, consultantLoad: true }, errors: { ...state.errors, consultantLoad: null } }));
    try {
      const { filterParams } = get();
      const response = await fetchConsultantLoad(filterParams);
      set({ consultantData: response, loading: { ...get().loading, consultantLoad: false } });
    } catch (error) {
      set({
        loading: { ...get().loading, consultantLoad: false },
        errors: { ...get().errors, consultantLoad: error instanceof Error ? error.message : 'Failed to fetch consultant load' },
      });
    }
  },

  fetchFollowUpTrendData: async () => {
    set((state) => ({ loading: { ...state.loading, followUpTrend: true }, errors: { ...state.errors, followUpTrend: null } }));
    try {
      const { filterParams } = get();
      const response = await fetchFollowUpTrend(filterParams);
      set({ followUpData: response, loading: { ...get().loading, followUpTrend: false } });
    } catch (error) {
      set({
        loading: { ...get().loading, followUpTrend: false },
        errors: { ...get().errors, followUpTrend: error instanceof Error ? error.message : 'Failed to fetch follow-up trend' },
      });
    }
  },

  fetchFilterOptionsData: async () => {
    set((state) => ({ loading: { ...state.loading, filterOptions: true }, errors: { ...state.errors, filterOptions: null } }));
    try {
      const response = await fetchFilterOptions();
      set({
        filterOptions: {
          projects: response.projects,
          consultants: response.consultants,
          channels: response.channels,
          stages: response.stages,
          months: response.months,
        },
        loading: { ...get().loading, filterOptions: false },
      });
    } catch (error) {
      set({
        loading: { ...get().loading, filterOptions: false },
        errors: { ...get().errors, filterOptions: error instanceof Error ? error.message : 'Failed to fetch filter options' },
      });
    }
  },

  submitExport: async (viewType, format) => {
    set((state) => ({ loading: { ...state.loading, exportSubmit: true }, errors: { ...state.errors, exportSubmit: null } }));
    try {
      const { filterParams } = get();
      const task = await apiSubmitExport(viewType, filterParams, format);
      set((state) => ({
        exportTasks: [task, ...state.exportTasks],
        loading: { ...get().loading, exportSubmit: false },
      }));
    } catch (error) {
      set({
        loading: { ...get().loading, exportSubmit: false },
        errors: { ...get().errors, exportSubmit: error instanceof Error ? error.message : 'Failed to submit export' },
      });
    }
  },

  fetchExportTasksData: async () => {
    set((state) => ({ loading: { ...state.loading, exportTasks: true }, errors: { ...state.errors, exportTasks: null } }));
    try {
      const tasks = await apiFetchExportTasks();
      set({ exportTasks: tasks, loading: { ...get().loading, exportTasks: false } });
    } catch (error) {
      set({
        loading: { ...get().loading, exportTasks: false },
        errors: { ...get().errors, exportTasks: error instanceof Error ? error.message : 'Failed to fetch export tasks' },
      });
    }
  },
}));
