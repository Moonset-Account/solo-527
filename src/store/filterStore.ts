import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FilterContext } from "@/types";
import { format, subDays } from "date-fns";

interface FilterStore extends FilterContext {
  setDateRange: (start: string, end: string) => void;
  setTeamIds: (teamIds: string[]) => void;
  setStaffIds: (staffIds: string[]) => void;
  setTimeGranularity: (granularity: "hour" | "day" | "week") => void;
  reset: () => void;
}

const today = format(new Date(), "yyyy-MM-dd");
const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      dateRange: { start: sevenDaysAgo, end: today },
      teamIds: [],
      staffIds: [],
      timeGranularity: "hour",
      setDateRange: (start, end) => set({ dateRange: { start, end } }),
      setTeamIds: (teamIds) => set({ teamIds }),
      setStaffIds: (staffIds) => set({ staffIds }),
      setTimeGranularity: (timeGranularity) => set({ timeGranularity }),
      reset: () =>
        set({
          dateRange: { start: sevenDaysAgo, end: today },
          teamIds: [],
          staffIds: [],
          timeGranularity: "hour",
        }),
    }),
    {
      name: "filter-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
