import { create } from 'zustand';
import type { FilterState, PrescriptionType, TimePeriod } from '@/types';

export interface DrillDownFilter {
  waitTimeRange?: string;
  windowNo?: string;
  hour?: string;
  processNode?: string;
}

interface FilterStore extends FilterState {
  drillDown: DrillDownFilter;
  setDateRange: (start: string, end: string) => void;
  setWindows: (windows: string[]) => void;
  setPharmacists: (pharmacists: string[]) => void;
  setDepartments: (departments: string[]) => void;
  setPrescriptionTypes: (types: PrescriptionType[]) => void;
  setTimePeriods: (periods: TimePeriod[]) => void;
  setDrillDown: (filter: DrillDownFilter) => void;
  clearDrillDown: () => void;
  resetFilters: () => void;
}

const today = new Date();
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

export const useFilterStore = create<FilterStore>((set) => ({
  dateRange: {
    start: thirtyDaysAgo.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  },
  windows: [],
  pharmacists: [],
  departments: [],
  prescriptionTypes: [],
  timePeriods: [],
  drillDown: {},
  setDateRange: (start, end) => set({ dateRange: { start, end } }),
  setWindows: (windows) => set({ windows }),
  setPharmacists: (pharmacists) => set({ pharmacists }),
  setDepartments: (departments) => set({ departments }),
  setPrescriptionTypes: (prescriptionTypes) => set({ prescriptionTypes }),
  setTimePeriods: (timePeriods) => set({ timePeriods }),
  setDrillDown: (drillDown) => set({ drillDown }),
  clearDrillDown: () => set({ drillDown: {} }),
  resetFilters: () =>
    set({
      windows: [],
      pharmacists: [],
      departments: [],
      prescriptionTypes: [],
      timePeriods: [],
      drillDown: {},
    }),
}));
