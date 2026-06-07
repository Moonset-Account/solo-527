import { create } from "zustand";
import type {
  FilterParams,
  SummaryData,
  ReasonNode,
  CycleDistribution,
  ProductRank,
  ServiceMetrics,
  FilterOptions,
  ReturnRecord,
} from "@/lib/types";
import { format, addDays } from "date-fns";

interface DashboardState {
  filters: FilterParams;
  filterOptions: FilterOptions | null;
  summary: SummaryData | null;
  reasons: ReasonNode | null;
  cycle: CycleDistribution | null;
  products: ProductRank[] | null;
  service: ServiceMetrics | null;
  records: ReturnRecord[] | null;
  recordsTotal: number;
  recordsPage: number;
  selectedRecord: ReturnRecord | null;
  detailPanelOpen: boolean;
  loading: Record<string, boolean>;
  drillPath: string[];
  setFilter: <K extends keyof FilterParams>(key: K, value: FilterParams[K]) => void;
  setTimeWindow: (window: FilterParams["timeWindow"]) => void;
  setDateRange: (start: string, end: string) => void;
  toggleFilterValue: (key: keyof Omit<FilterParams, "dateRange" | "timeWindow">, value: string) => void;
  clearAllFilters: () => void;
  fetchFilterOptions: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchReasons: () => Promise<void>;
  fetchCycle: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchService: () => Promise<void>;
  fetchRecords: (page?: number) => Promise<void>;
  fetchAll: () => Promise<void>;
  openDetail: (record: ReturnRecord) => void;
  closeDetail: () => void;
  addDrillPath: (path: string) => void;
  clearDrillPath: () => void;
  buildQueryString: () => string;
}

const getDefaultDateRange = () => {
  const today = new Date();
  return {
    start: format(addDays(today, -7), "yyyy-MM-dd"),
    end: format(today, "yyyy-MM-dd"),
  };
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  filters: {
    dateRange: getDefaultDateRange(),
    timeWindow: "7d",
    products: [],
    stores: [],
    reasons: [],
    warehouses: [],
    logistics: [],
  },
  filterOptions: null,
  summary: null,
  reasons: null,
  cycle: null,
  products: null,
  service: null,
  records: null,
  recordsTotal: 0,
  recordsPage: 1,
  selectedRecord: null,
  detailPanelOpen: false,
  loading: {},
  drillPath: [],

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  setTimeWindow: (window) => {
    const today = new Date();
    let start: string;
    switch (window) {
      case "today":
        start = format(today, "yyyy-MM-dd");
        break;
      case "30d":
        start = format(addDays(today, -30), "yyyy-MM-dd");
        break;
      case "7d":
      default:
        start = format(addDays(today, -7), "yyyy-MM-dd");
        break;
    }
    set((state) => ({
      filters: {
        ...state.filters,
        timeWindow: window,
        dateRange: { start, end: format(today, "yyyy-MM-dd") },
      },
    }));
    get().fetchAll();
  },

  setDateRange: (start, end) => {
    set((state) => ({
      filters: {
        ...state.filters,
        timeWindow: "custom",
        dateRange: { start, end },
      },
    }));
    get().fetchAll();
  },

  toggleFilterValue: (key, value) => {
    set((state) => {
      const current = state.filters[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { filters: { ...state.filters, [key]: next } };
    });
    get().fetchAll();
  },

  clearAllFilters: () => {
    set({
      filters: {
        dateRange: getDefaultDateRange(),
        timeWindow: "7d",
        products: [],
        stores: [],
        reasons: [],
        warehouses: [],
        logistics: [],
      },
      drillPath: [],
    });
    get().fetchAll();
  },

  buildQueryString: () => {
    const { filters } = get();
    const params = new URLSearchParams();
    params.set("timeWindow", filters.timeWindow);
    params.set("start", filters.dateRange.start);
    params.set("end", filters.dateRange.end);
    if (filters.products.length > 0) params.set("products", filters.products.join(","));
    if (filters.stores.length > 0) params.set("stores", filters.stores.join(","));
    if (filters.reasons.length > 0) params.set("reasons", filters.reasons.join(","));
    if (filters.warehouses.length > 0) params.set("warehouses", filters.warehouses.join(","));
    if (filters.logistics.length > 0) params.set("logistics", filters.logistics.join(","));
    return params.toString();
  },

  fetchFilterOptions: async () => {
    try {
      const res = await fetch("/api/options");
      const data = await res.json();
      set({ filterOptions: data });
    } catch (e) {
      console.error("Failed to fetch options", e);
    }
  },

  fetchSummary: async () => {
    set((s) => ({ loading: { ...s.loading, summary: true } }));
    try {
      const qs = get().buildQueryString();
      const res = await fetch(`/api/dashboard/summary?${qs}`);
      const data = await res.json();
      set({ summary: data });
    } finally {
      set((s) => ({ loading: { ...s.loading, summary: false } }));
    }
  },

  fetchReasons: async () => {
    set((s) => ({ loading: { ...s.loading, reasons: true } }));
    try {
      const qs = get().buildQueryString();
      const res = await fetch(`/api/dashboard/reasons?${qs}`);
      const data = await res.json();
      set({ reasons: data });
    } finally {
      set((s) => ({ loading: { ...s.loading, reasons: false } }));
    }
  },

  fetchCycle: async () => {
    set((s) => ({ loading: { ...s.loading, cycle: true } }));
    try {
      const qs = get().buildQueryString();
      const res = await fetch(`/api/dashboard/cycle?${qs}`);
      const data = await res.json();
      set({ cycle: data });
    } finally {
      set((s) => ({ loading: { ...s.loading, cycle: false } }));
    }
  },

  fetchProducts: async () => {
    set((s) => ({ loading: { ...s.loading, products: true } }));
    try {
      const qs = get().buildQueryString();
      const res = await fetch(`/api/dashboard/products?${qs}`);
      const data = await res.json();
      set({ products: data });
    } finally {
      set((s) => ({ loading: { ...s.loading, products: false } }));
    }
  },

  fetchService: async () => {
    set((s) => ({ loading: { ...s.loading, service: true } }));
    try {
      const qs = get().buildQueryString();
      const res = await fetch(`/api/dashboard/service?${qs}`);
      const data = await res.json();
      set({ service: data });
    } finally {
      set((s) => ({ loading: { ...s.loading, service: false } }));
    }
  },

  fetchRecords: async (page = 1) => {
    set((s) => ({ loading: { ...s.loading, records: true }, recordsPage: page }));
    try {
      const qs = get().buildQueryString();
      const res = await fetch(`/api/dashboard/records?${qs}&page=${page}&pageSize=20`);
      const data = await res.json();
      set({ records: data.records, recordsTotal: data.total });
    } finally {
      set((s) => ({ loading: { ...s.loading, records: false } }));
    }
  },

  fetchAll: async () => {
    await Promise.all([
      get().fetchSummary(),
      get().fetchReasons(),
      get().fetchCycle(),
      get().fetchProducts(),
      get().fetchService(),
      get().fetchRecords(),
    ]);
  },

  openDetail: (record) => {
    set({ selectedRecord: record, detailPanelOpen: true });
  },

  closeDetail: () => {
    set({ detailPanelOpen: false, selectedRecord: null });
  },

  addDrillPath: (path) => {
    set((state) => ({ drillPath: [...state.drillPath, path] }));
  },

  clearDrillPath: () => {
    set({ drillPath: [] });
  },
}));
