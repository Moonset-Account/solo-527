import { create } from "zustand";

type TimePeriod = "DAY" | "WEEK" | "MONTH";

interface MetricStore {
  selectedPeriod: TimePeriod;
  isCaliberDrawerOpen: boolean;
  selectedMetricId: string | null;

  setPeriod: (period: TimePeriod) => void;
  openCaliberDrawer: (metricId: string) => void;
  closeCaliberDrawer: () => void;
  setSelectedMetricId: (id: string | null) => void;
}

export const useMetricStore = create<MetricStore>((set) => ({
  selectedPeriod: "DAY",
  isCaliberDrawerOpen: false,
  selectedMetricId: null,

  setPeriod: (period) => set({ selectedPeriod: period }),
  openCaliberDrawer: (metricId) =>
    set({ isCaliberDrawerOpen: true, selectedMetricId: metricId }),
  closeCaliberDrawer: () =>
    set({ isCaliberDrawerOpen: false }),
  setSelectedMetricId: (id) => set({ selectedMetricId: id }),
}));
