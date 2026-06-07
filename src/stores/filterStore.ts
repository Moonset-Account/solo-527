import { create } from "zustand"
import type { Perspective, Granularity } from "@/types"

interface FilterStore {
  dateStart: string
  dateEnd: string
  shift: string
  slot: string
  route: string
  device: string
  granularity: Granularity
  perspective: Perspective
  setDateStart: (v: string) => void
  setDateEnd: (v: string) => void
  setShift: (v: string) => void
  setSlot: (v: string) => void
  setRoute: (v: string) => void
  setDevice: (v: string) => void
  setGranularity: (v: Granularity) => void
  setPerspective: (v: Perspective) => void
  resetFilters: () => void
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 19)
}

export const useFilterStore = create<FilterStore>((set) => ({
  dateStart: daysAgo(7),
  dateEnd: daysAgo(0),
  shift: "",
  slot: "",
  route: "",
  device: "",
  granularity: "day",
  perspective: "shift",
  setDateStart: (v) => set({ dateStart: v }),
  setDateEnd: (v) => set({ dateEnd: v }),
  setShift: (v) => set({ shift: v }),
  setSlot: (v) => set({ slot: v }),
  setRoute: (v) => set({ route: v }),
  setDevice: (v) => set({ device: v }),
  setGranularity: (v) => set({ granularity: v }),
  setPerspective: (v) => set({ perspective: v }),
  resetFilters: () =>
    set({
      dateStart: daysAgo(7),
      dateEnd: daysAgo(0),
      shift: "",
      slot: "",
      route: "",
      device: "",
      granularity: "day",
    }),
}))
