import { create } from "zustand";

interface Filters {
  status: string;
  search: string;
  dateRange: { start: Date | null; end: Date | null };
}

interface AppState {
  sidebarCollapsed: boolean;
  currentPage: string;
  filters: Filters;
  toggleSidebar: () => void;
  setPage: (page: string) => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
}

const defaultFilters: Filters = {
  status: "",
  search: "",
  dateRange: { start: null, end: null },
};

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  currentPage: "dashboard",
  filters: { ...defaultFilters },
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setPage: (page) => set({ currentPage: page }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}));
