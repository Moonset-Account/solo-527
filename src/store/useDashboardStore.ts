import { create } from 'zustand';
import type { KPIData, Station, Alert, HourlyData, EtlStatus, FilterCondition } from '@shared/types';

interface DashboardState {
  kpi: KPIData | null;
  stations: Station[];
  alerts: Alert[];
  hourlyData: HourlyData[];
  etlStatuses: EtlStatus[];
  etlWarnings: string[];
  lastUpdateTime: number;
  dataVersion: string;
  filters: FilterCondition;
  savedFilters: FilterCondition[];
  selectedStation: Station | null;
  isLoading: boolean;
  error: string | null;

  setKpi: (kpi: KPIData) => void;
  setStations: (stations: Station[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setHourlyData: (data: HourlyData[]) => void;
  setEtlStatuses: (statuses: EtlStatus[]) => void;
  setEtlInfo: (updateTime: number, version: string, warnings: string[]) => void;
  setFilters: (filters: Partial<FilterCondition>) => void;
  setSavedFilters: (filters: FilterCondition[]) => void;
  saveCurrentFilter: (name: string) => Promise<boolean>;
  applyFilter: (filter: FilterCondition) => void;
  deleteFilter: (filterId: string) => Promise<boolean>;
  fetchSavedFilters: () => Promise<void>;
  setSelectedStation: (station: Station | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetFilters: () => void;
}

const now = Date.now();
const defaultFilters: FilterCondition = {
  timeRange: [now - 7 * 24 * 3600 * 1000, now],
  areas: [],
  stationIds: [],
  bikeStatus: ['all'],
  weatherTypes: [],
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  kpi: null,
  stations: [],
  alerts: [],
  hourlyData: [],
  etlStatuses: [],
  etlWarnings: [],
  lastUpdateTime: 0,
  dataVersion: '',
  filters: defaultFilters,
  savedFilters: [],
  selectedStation: null,
  isLoading: false,
  error: null,

  setKpi: (kpi) => set({ kpi }),
  setStations: (stations) => set({ stations }),
  setAlerts: (alerts) => set({ alerts }),
  setHourlyData: (hourlyData) => set({ hourlyData }),
  setEtlStatuses: (etlStatuses) => set({ etlStatuses }),
  setEtlInfo: (updateTime, dataVersion, warnings) => set({
    lastUpdateTime: updateTime,
    dataVersion,
    etlWarnings: warnings,
  }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  setSavedFilters: (savedFilters) => set({ savedFilters }),
  setSelectedStation: (selectedStation) => set({ selectedStation }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  resetFilters: () => set({ filters: defaultFilters }),

  fetchSavedFilters: async () => {
    try {
      const res = await fetch('/api/etl/filters');
      const result = await res.json();
      if (result.code === 0) {
        set({ savedFilters: result.data });
      }
    } catch (e) {
      console.error('获取筛选组合失败', e);
    }
  },

  saveCurrentFilter: async (name: string) => {
    try {
      const { filters } = get();
      const res = await fetch('/api/etl/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...filters, name }),
      });
      const result = await res.json();
      if (result.code === 0) {
        set((state) => ({
          savedFilters: [...state.savedFilters, result.data],
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error('保存筛选组合失败', e);
      return false;
    }
  },

  applyFilter: (filter: FilterCondition) => {
    set({
      filters: {
        timeRange: filter.timeRange,
        areas: filter.areas || [],
        stationIds: filter.stationIds || [],
        bikeStatus: filter.bikeStatus || ['all'],
        weatherTypes: filter.weatherTypes || [],
      },
    });
  },

  deleteFilter: async (filterId: string) => {
    try {
      const res = await fetch(`/api/etl/filters/${filterId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.code === 0) {
        set((state) => ({
          savedFilters: state.savedFilters.filter(f => f.id !== filterId),
        }));
        return true;
      }
      return false;
    } catch (e) {
      console.error('删除筛选组合失败', e);
      return false;
    }
  },
}));
