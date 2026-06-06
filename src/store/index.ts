import { create } from "zustand";
import { FilterState, VisitProcess, Annotation } from "@/types";
import {
  MOCK_VISITS,
  MOCK_ANNOTATIONS,
  filterVisits,
  calculateKPIMetrics,
  generateSankeyData,
  generateWaitDistribution,
  generateDepartmentComparison,
  generateTrendData,
  generateHeatmapData,
} from "@/mock/data";

interface AppState {
  filters: FilterState;
  allVisits: VisitProcess[];
  annotations: Annotation[];
  selectedVisit: VisitProcess | null;
  isFilterPanelOpen: boolean;

  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSelectedVisit: (visit: VisitProcess | null) => void;
  toggleFilterPanel: () => void;
  addAnnotation: (annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt">) => void;

  getFilteredVisits: () => VisitProcess[];
  getKPIMetrics: () => ReturnType<typeof calculateKPIMetrics>;
  getSankeyData: () => ReturnType<typeof generateSankeyData>;
  getWaitDistribution: () => ReturnType<typeof generateWaitDistribution>;
  getDepartmentComparison: () => ReturnType<typeof generateDepartmentComparison>;
  getTrendData: () => ReturnType<typeof generateTrendData>;
  getHeatmapData: () => ReturnType<typeof generateHeatmapData>;
}

const DEFAULT_FILTERS: FilterState = {
  dateRange: null,
  departments: [],
  doctors: [],
  patientTypes: [],
  timeSlots: [],
  processNodes: [],
  hourRange: [0, 24],
};

export const useAppStore = create<AppState>((set, get) => ({
  filters: DEFAULT_FILTERS,
  allVisits: MOCK_VISITS,
  annotations: MOCK_ANNOTATIONS,
  selectedVisit: null,
  isFilterPanelOpen: true,

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  setSelectedVisit: (visit) => set({ selectedVisit: visit }),

  toggleFilterPanel: () =>
    set((state) => ({ isFilterPanelOpen: !state.isFilterPanelOpen })),

  addAnnotation: (annotation) =>
    set((state) => ({
      annotations: [
        ...state.annotations,
        {
          ...annotation,
          id: `ann-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Annotation,
      ],
    })),

  getFilteredVisits: () => {
    const { allVisits, filters } = get();
    return filterVisits(allVisits, filters);
  },

  getKPIMetrics: () => {
    const filtered = get().getFilteredVisits();
    return calculateKPIMetrics(filtered);
  },

  getSankeyData: () => {
    const filtered = get().getFilteredVisits();
    return generateSankeyData(filtered);
  },

  getWaitDistribution: () => {
    const filtered = get().getFilteredVisits();
    return generateWaitDistribution(filtered);
  },

  getDepartmentComparison: () => {
    const filtered = get().getFilteredVisits();
    return generateDepartmentComparison(filtered);
  },

  getTrendData: () => {
    const filtered = get().getFilteredVisits();
    return generateTrendData(filtered);
  },

  getHeatmapData: () => {
    const filtered = get().getFilteredVisits();
    return generateHeatmapData(filtered);
  },
}));
