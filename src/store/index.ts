import { create } from "zustand";
import type { FilterParams, UserRole, AnomalyAnnotation } from "@/types";

interface AppState {
  filters: FilterParams;
  role: UserRole;
  sidebarOpen: boolean;
  annotationPanelOpen: boolean;
  annotations: AnomalyAnnotation[];
  setFilters: (filters: Partial<FilterParams>) => void;
  resetFilters: () => void;
  setRole: (role: UserRole) => void;
  toggleSidebar: () => void;
  toggleAnnotationPanel: () => void;
  addAnnotation: (annotation: AnomalyAnnotation) => void;
  setAnnotations: (annotations: AnomalyAnnotation[]) => void;
}

const defaultFilters: FilterParams = {
  positions: [],
  departments: [],
  recruiters: [],
  channels: [],
  stages: [],
  dateRange: {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  },
};

export const useAppStore = create<AppState>((set) => ({
  filters: defaultFilters,
  role: "hr_admin",
  sidebarOpen: true,
  annotationPanelOpen: false,
  annotations: [],
  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
  setRole: (role) => set({ role }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleAnnotationPanel: () =>
    set((state) => ({ annotationPanelOpen: !state.annotationPanelOpen })),
  addAnnotation: (annotation) =>
    set((state) => ({ annotations: [...state.annotations, annotation] })),
  setAnnotations: (annotations) => set({ annotations }),
}));
