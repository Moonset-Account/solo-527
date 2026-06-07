import { create } from 'zustand'
import type { FilterState, DrillDownState } from '@/types'
import { getDateRange } from '@/data/mock'

interface FilterStore extends FilterState {
  drillDown: DrillDownState
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
  setDrillDown: (drillDown: DrillDownState) => void
  clearDrillDown: () => void
}

const defaultDateRange = getDateRange()

const initialState: FilterState = {
  equipmentIds: [],
  productionLines: [],
  shifts: [],
  faultTypes: [],
  maintenancePeople: [],
  dateRange: defaultDateRange,
  downtimeType: 'all',
}

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialState,
  drillDown: { faultType: null, equipmentId: null, productionLine: null },
  setFilter: (key, value) => set({ [key]: value } as Partial<FilterState>),
  resetFilters: () => set(initialState),
  setDrillDown: (drillDown) => set({ drillDown }),
  clearDrillDown: () => set({ drillDown: { faultType: null, equipmentId: null, productionLine: null } }),
}))
