import { create } from "zustand";
import { persist } from "zustand/middleware";
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

interface AuthUser {
  id: string;
  username: string;
  realNameMasked: string | null;
  roleId: string;
  roleName: string;
  departmentScopes: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
}

interface AppState {
  filters: FilterState;
  allVisits: VisitProcess[];
  annotations: Annotation[];
  selectedVisit: VisitProcess | null;
  isFilterPanelOpen: boolean;
  isLoadingVisits: boolean;
  dataSource: "mock" | "api";

  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSelectedVisit: (visit: VisitProcess | null) => void;
  toggleFilterPanel: () => void;
  addAnnotation: (annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt">) => void;
  setAllVisits: (visits: VisitProcess[]) => void;
  setDataSource: (source: "mock" | "api") => void;

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

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            set({ isLoading: false });
            return { success: false, error: data.error || "登录失败" };
          }

          set({
            token: data.token,
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          console.error("Login error:", error);
          set({ isLoading: false });
          return { success: false, error: "网络错误，请稍后重试" };
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      setToken: (token: string) => set({ token }),
      setUser: (user: AuthUser) => set({ user, isAuthenticated: true }),
    }),
    {
      name: "hospital-auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

const useAppStore = create<AppState>((set, get) => ({
  filters: DEFAULT_FILTERS,
  allVisits: MOCK_VISITS,
  annotations: MOCK_ANNOTATIONS,
  selectedVisit: null,
  isFilterPanelOpen: true,
  isLoadingVisits: false,
  dataSource: "mock",

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
        {
          ...annotation,
          id: `ann-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Annotation,
        ...state.annotations,
      ],
    })),

  setAllVisits: (visits) => set({ allVisits: visits }),

  setDataSource: (source) => set({ dataSource: source }),

  getFilteredVisits: () => {
    const { filters, allVisits } = get();
    return filterVisits(allVisits, filters);
  },

  getKPIMetrics: () => {
    const visits = get().getFilteredVisits();
    return calculateKPIMetrics(visits);
  },

  getSankeyData: () => {
    const visits = get().getFilteredVisits();
    return generateSankeyData(visits);
  },

  getWaitDistribution: () => {
    const visits = get().getFilteredVisits();
    return generateWaitDistribution(visits);
  },

  getDepartmentComparison: () => {
    const visits = get().getFilteredVisits();
    return generateDepartmentComparison(visits);
  },

  getTrendData: () => {
    const visits = get().getFilteredVisits();
    return generateTrendData(visits);
  },

  getHeatmapData: () => {
    const visits = get().getFilteredVisits();
    return generateHeatmapData(visits);
  },
}));

export { useAppStore, useAuthStore };
