import { create } from "zustand";
import { persist } from "zustand/middleware";

type FilterState = {
  campusIds: string[];
  courseIds: string[];
  ageGroups: string[];
  channels: string[];
  dateRange: { start: Date | null; end: Date | null };
};

type FilterActions = {
  setFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => void;
  resetFilters: () => void;
};

const initialState: FilterState = {
  campusIds: [],
  courseIds: [],
  ageGroups: [],
  channels: [],
  dateRange: { start: null, end: null },
};

export const useFilterStore = create<FilterState & FilterActions>()(
  persist(
    (set) => ({
      ...initialState,
      setFilter: (key, value) => set({ [key]: value }),
      resetFilters: () => set(initialState),
    }),
    {
      name: "waitlist-filters",
      partialize: (state) => ({
        campusIds: state.campusIds,
        courseIds: state.courseIds,
        ageGroups: state.ageGroups,
        channels: state.channels,
        dateRange: state.dateRange,
      }),
    }
  )
);
