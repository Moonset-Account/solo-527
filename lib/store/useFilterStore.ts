import { create } from 'zustand';
import type { MeasurementQuery } from '@/types';

interface FilterState extends MeasurementQuery {
  selectedIndicator: string;
  showManual: boolean;
  showAutomatic: boolean;
  showAnomalies: boolean;
  setFilters: (filters: Partial<MeasurementQuery>) => void;
  setSelectedIndicator: (indicator: string) => void;
  setShowManual: (show: boolean) => void;
  setShowAutomatic: (show: boolean) => void;
  setShowAnomalies: (show: boolean) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  siteIds: [],
  riverSections: [],
  organizations: [],
  startDate: undefined,
  endDate: undefined,
  dataSource: 'all',
  onlyAnomalies: false,
  selectedIndicator: 'dissolvedOxygen',
  showManual: true,
  showAutomatic: true,
  showAnomalies: true,

  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  setSelectedIndicator: (indicator) => set({ selectedIndicator: indicator }),
  setShowManual: (show) => set({ showManual: show }),
  setShowAutomatic: (show) => set({ showAutomatic: show }),
  setShowAnomalies: (show) => set({ showAnomalies: show }),

  resetFilters: () => set({
    siteIds: [],
    riverSections: [],
    organizations: [],
    startDate: undefined,
    endDate: undefined,
    dataSource: 'all',
    onlyAnomalies: false,
    selectedIndicator: 'dissolvedOxygen',
    showManual: true,
    showAutomatic: true,
    showAnomalies: true,
  }),
}));
