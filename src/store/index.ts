import { create } from 'zustand';
import type { Vehicle, Route, Customer, DeliveryBatch, TemperatureProbe, DataQualityReport } from '@shared/types';

interface FilterState {
  selectedVehicleId: string | null;
  selectedRouteId: string | null;
  selectedBatchId: string | null;
  selectedCustomerId: string | null;
  selectedProbeId: string | null;
  dateRange: [number, number] | null;
  setSelectedVehicleId: (id: string | null) => void;
  setSelectedRouteId: (id: string | null) => void;
  setSelectedBatchId: (id: string | null) => void;
  setSelectedCustomerId: (id: string | null) => void;
  setSelectedProbeId: (id: string | null) => void;
  setDateRange: (range: [number, number] | null) => void;
  clearFilters: () => void;
}

interface MetaState {
  vehicles: Vehicle[];
  routes: Route[];
  customers: Customer[];
  batches: DeliveryBatch[];
  probes: TemperatureProbe[];
  dataQuality: DataQualityReport | null;
  loading: boolean;
  error: string | null;
  setVehicles: (vehicles: Vehicle[]) => void;
  setRoutes: (routes: Route[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setBatches: (batches: DeliveryBatch[]) => void;
  setProbes: (probes: TemperatureProbe[]) => void;
  setDataQuality: (dq: DataQualityReport | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

interface UIState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  showDataQualityWarning: boolean;
  setShowDataQualityWarning: (show: boolean) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedVehicleId: null,
  selectedRouteId: null,
  selectedBatchId: null,
  selectedCustomerId: null,
  selectedProbeId: null,
  dateRange: null,
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setSelectedRouteId: (id) => set({ selectedRouteId: id }),
  setSelectedBatchId: (id) => set({ selectedBatchId: id }),
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  setSelectedProbeId: (id) => set({ selectedProbeId: id }),
  setDateRange: (range) => set({ dateRange: range }),
  clearFilters: () => set({
    selectedVehicleId: null,
    selectedRouteId: null,
    selectedBatchId: null,
    selectedCustomerId: null,
    selectedProbeId: null,
    dateRange: null,
  }),
}));

export const useMetaStore = create<MetaState>((set) => ({
  vehicles: [],
  routes: [],
  customers: [],
  batches: [],
  probes: [],
  dataQuality: null,
  loading: false,
  error: null,
  setVehicles: (vehicles) => set({ vehicles }),
  setRoutes: (routes) => set({ routes }),
  setCustomers: (customers) => set({ customers }),
  setBatches: (batches) => set({ batches }),
  setProbes: (probes) => set({ probes }),
  setDataQuality: (dataQuality) => set({ dataQuality }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  showDataQualityWarning: false,
  setShowDataQualityWarning: (show) => set({ showDataQualityWarning: show }),
}));
