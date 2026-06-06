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
  setSelectedStation: (station: Station | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const now = Date.now();
const defaultFilters: FilterCondition = {
  timeRange: [now - 7 * 24 * 3600 * 1000, now],
  areas: [],
  stationIds: [],
  bikeStatus: ['all'],
  weatherTypes: [],
};

export const useDashboardStore = create<DashboardState>((set) => ({
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
}));
