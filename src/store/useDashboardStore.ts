import { create } from 'zustand';
import type {
  FilterParams,
  TimeWindow,
  KPIData,
  SubjectTrend,
  BranchComparison,
  OverdueHeatmapItem,
  ReservationAnalysis,
  AgeGroupData,
  DataQualityStatus,
  SavedFilter,
  RawRecordWithValidation,
  RenewTrend,
  RenewByBranch,
  ActivityParticipationTrend,
  ActivityByType,
} from '../../shared/types.js';
import { apiClient } from '../api/client.js';

interface DashboardState {
  filters: FilterParams;
  filterOptions: {
    collections: string[];
    subjects: string[];
    branches: string[];
    readerGroups: string[];
    months: string[];
  };
  kpiData: KPIData | null;
  subjectTrends: SubjectTrend[];
  branchComparison: BranchComparison[];
  overdueHeatmap: OverdueHeatmapItem[];
  reservationAnalysis: ReservationAnalysis | null;
  ageGroupData: AgeGroupData[];
  dataQualityStatus: DataQualityStatus | null;
  savedFilters: SavedFilter[];
  rawRecords: RawRecordWithValidation[];
  renewTrends: RenewTrend[];
  renewByBranch: RenewByBranch[];
  activityTrends: ActivityParticipationTrend[];
  activityByType: ActivityByType[];
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
  sidebarOpen: boolean;

  setFilters: (filters: Partial<FilterParams>) => void;
  setTimeWindow: (window: TimeWindow) => void;
  toggleSidebar: () => void;
  loadFilterOptions: () => Promise<void>;
  loadKPIData: () => Promise<void>;
  loadSubjectTrends: () => Promise<void>;
  loadBranchComparison: () => Promise<void>;
  loadOverdueHeatmap: () => Promise<void>;
  loadReservationAnalysis: () => Promise<void>;
  loadAgeGroupData: () => Promise<void>;
  loadDataQualityStatus: () => Promise<void>;
  loadSavedFilters: () => Promise<void>;
  loadRawRecords: (limit?: number) => Promise<void>;
  loadRenewTrends: () => Promise<void>;
  loadRenewByBranch: () => Promise<void>;
  loadActivityTrends: () => Promise<void>;
  loadActivityByType: () => Promise<void>;
  saveCurrentFilter: (name: string) => Promise<void>;
  applySavedFilter: (filter: SavedFilter) => void;
  deleteSavedFilter: (id: string) => Promise<void>;
  refreshETL: () => Promise<void>;
  loadAllDashboardData: () => Promise<void>;
}

const defaultFilters: FilterParams = {
  collections: [],
  readerGroups: [],
  subjects: [],
  branches: [],
  months: [],
  timeWindow: '30d',
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  filters: defaultFilters,
  filterOptions: {
    collections: [],
    subjects: [],
    branches: [],
    readerGroups: [],
    months: [],
  },
  kpiData: null,
  subjectTrends: [],
  branchComparison: [],
  overdueHeatmap: [],
  reservationAnalysis: null,
  ageGroupData: [],
  dataQualityStatus: null,
  savedFilters: [],
  rawRecords: [],
  renewTrends: [],
  renewByBranch: [],
  activityTrends: [],
  activityByType: [],
  loading: {},
  errors: {},
  sidebarOpen: true,

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  setTimeWindow: (timeWindow) =>
    set((state) => ({
      filters: { ...state.filters, timeWindow },
    })),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  loadFilterOptions: async () => {
    try {
      const data = await apiClient.getFilterOptions();
      set({ filterOptions: data });
    } catch (error) {
      set({ errors: { filterOptions: (error as Error).message } });
    }
  },

  loadKPIData: async () => {
    set({ loading: { ...get().loading, kpi: true } });
    try {
      const data = await apiClient.getKPIData(get().filters);
      set({ kpiData: data, errors: { ...get().errors, kpi: null } });
    } catch (error) {
      set({ errors: { ...get().errors, kpi: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, kpi: false } });
    }
  },

  loadSubjectTrends: async () => {
    set({ loading: { ...get().loading, trends: true } });
    try {
      const data = await apiClient.getSubjectTrends(get().filters);
      set({ subjectTrends: data, errors: { ...get().errors, trends: null } });
    } catch (error) {
      set({ errors: { ...get().errors, trends: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, trends: false } });
    }
  },

  loadBranchComparison: async () => {
    set({ loading: { ...get().loading, branch: true } });
    try {
      const data = await apiClient.getBranchComparison(get().filters);
      set({ branchComparison: data, errors: { ...get().errors, branch: null } });
    } catch (error) {
      set({ errors: { ...get().errors, branch: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, branch: false } });
    }
  },

  loadOverdueHeatmap: async () => {
    set({ loading: { ...get().loading, heatmap: true } });
    try {
      const data = await apiClient.getOverdueHeatmap(get().filters);
      set({ overdueHeatmap: data, errors: { ...get().errors, heatmap: null } });
    } catch (error) {
      set({ errors: { ...get().errors, heatmap: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, heatmap: false } });
    }
  },

  loadReservationAnalysis: async () => {
    set({ loading: { ...get().loading, reservation: true } });
    try {
      const data = await apiClient.getReservationAnalysis(get().filters);
      set({ reservationAnalysis: data, errors: { ...get().errors, reservation: null } });
    } catch (error) {
      set({ errors: { ...get().errors, reservation: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, reservation: false } });
    }
  },

  loadAgeGroupData: async () => {
    set({ loading: { ...get().loading, ageGroups: true } });
    try {
      const data = await apiClient.getAgeGroupAnalysis(get().filters);
      set({ ageGroupData: data, errors: { ...get().errors, ageGroups: null } });
    } catch (error) {
      set({ errors: { ...get().errors, ageGroups: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, ageGroups: false } });
    }
  },

  loadDataQualityStatus: async () => {
    set({ loading: { ...get().loading, dataQuality: true } });
    try {
      const data = await apiClient.getDataQualityStatus();
      set({ dataQualityStatus: data, errors: { ...get().errors, dataQuality: null } });
    } catch (error) {
      set({ errors: { ...get().errors, dataQuality: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, dataQuality: false } });
    }
  },

  loadSavedFilters: async () => {
    try {
      const data = await apiClient.getSavedFilters();
      set({ savedFilters: data });
    } catch (error) {
      set({ errors: { ...get().errors, savedFilters: (error as Error).message } });
    }
  },

  loadRawRecords: async (limit = 100) => {
    set({ loading: { ...get().loading, rawRecords: true } });
    try {
      const data = await apiClient.getRawRecords(get().filters, limit);
      set({ rawRecords: data, errors: { ...get().errors, rawRecords: null } });
    } catch (error) {
      set({ errors: { ...get().errors, rawRecords: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, rawRecords: false } });
    }
  },

  loadRenewTrends: async () => {
    set({ loading: { ...get().loading, renewTrends: true } });
    try {
      const data = await apiClient.getRenewTrends(get().filters);
      set({ renewTrends: data, errors: { ...get().errors, renewTrends: null } });
    } catch (error) {
      set({ errors: { ...get().errors, renewTrends: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, renewTrends: false } });
    }
  },

  loadRenewByBranch: async () => {
    set({ loading: { ...get().loading, renewBranch: true } });
    try {
      const data = await apiClient.getRenewByBranch(get().filters);
      set({ renewByBranch: data, errors: { ...get().errors, renewBranch: null } });
    } catch (error) {
      set({ errors: { ...get().errors, renewBranch: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, renewBranch: false } });
    }
  },

  loadActivityTrends: async () => {
    set({ loading: { ...get().loading, activityTrends: true } });
    try {
      const data = await apiClient.getActivityTrends(get().filters);
      set({ activityTrends: data, errors: { ...get().errors, activityTrends: null } });
    } catch (error) {
      set({ errors: { ...get().errors, activityTrends: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, activityTrends: false } });
    }
  },

  loadActivityByType: async () => {
    set({ loading: { ...get().loading, activityType: true } });
    try {
      const data = await apiClient.getActivityByType(get().filters);
      set({ activityByType: data, errors: { ...get().errors, activityType: null } });
    } catch (error) {
      set({ errors: { ...get().errors, activityType: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, activityType: false } });
    }
  },

  saveCurrentFilter: async (name: string) => {
    try {
      await apiClient.saveFilter(name, get().filters);
      await get().loadSavedFilters();
    } catch (error) {
      set({ errors: { ...get().errors, saveFilter: (error as Error).message } });
    }
  },

  applySavedFilter: (filter: SavedFilter) => {
    set({ filters: filter.params });
  },

  deleteSavedFilter: async (id: string) => {
    try {
      await apiClient.deleteFilter(id);
      await get().loadSavedFilters();
    } catch (error) {
      set({ errors: { ...get().errors, deleteFilter: (error as Error).message } });
    }
  },

  refreshETL: async () => {
    set({ loading: { ...get().loading, etl: true } });
    try {
      await apiClient.refreshETL();
      await get().loadAllDashboardData();
    } catch (error) {
      set({ errors: { ...get().errors, etl: (error as Error).message } });
    } finally {
      set({ loading: { ...get().loading, etl: false } });
    }
  },

  loadAllDashboardData: async () => {
    await Promise.all([
      get().loadKPIData(),
      get().loadSubjectTrends(),
      get().loadBranchComparison(),
    ]);
  },
}));
