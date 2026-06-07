import { create } from 'zustand'
import { FilterState, TimePeriod, VehicleStatus, DispatchStatusFilter } from '@/types'
import { setCache, getCache } from '@/data/cache'

interface FilterStoreState extends FilterState {
  repairExcludedCount: number
}

interface FilterStoreActions {
  setStationIds: (ids: string[]) => void
  setRouteIds: (ids: string[]) => void
  setTimePeriod: (period: TimePeriod) => void
  setCustomTimeRange: (range: [string, string] | null) => void
  setVehicleStatus: (status: VehicleStatus) => void
  setDispatchStatus: (status: DispatchStatusFilter) => void
  setWeatherConditions: (conditions: string[]) => void
  setRepairExcludedCount: (count: number) => void
  resetFilters: () => void
}

type FilterStore = FilterStoreState & FilterStoreActions

const defaultState: FilterStoreState = {
  stationIds: [],
  routeIds: [],
  timePeriod: 'all_day',
  customTimeRange: null,
  vehicleStatus: 'all',
  dispatchStatus: 'all',
  weatherConditions: [],
  repairExcludedCount: 0,
}

function loadCachedState(): Partial<FilterStoreState> | null {
  return getCache<Partial<FilterStoreState>>('filter_state')
}

function persistState(state: FilterStoreState): void {
  setCache('filter_state', state, Infinity)
}

const cached = loadCachedState()

export const useFilterStore = create<FilterStore>()((set) => ({
  ...defaultState,
  ...cached,

  setStationIds: (ids) =>
    set((s) => {
      const next = { ...s, stationIds: ids }
      persistState(next)
      return next
    }),

  setRouteIds: (ids) =>
    set((s) => {
      const next = { ...s, routeIds: ids }
      persistState(next)
      return next
    }),

  setTimePeriod: (period) =>
    set((s) => {
      const next = { ...s, timePeriod: period }
      persistState(next)
      return next
    }),

  setCustomTimeRange: (range) =>
    set((s) => {
      const next = { ...s, customTimeRange: range }
      persistState(next)
      return next
    }),

  setVehicleStatus: (status) =>
    set((s) => {
      const next = { ...s, vehicleStatus: status }
      persistState(next)
      return next
    }),

  setDispatchStatus: (status) =>
    set((s) => {
      const next = { ...s, dispatchStatus: status }
      persistState(next)
      return next
    }),

  setWeatherConditions: (conditions) =>
    set((s) => {
      const next = { ...s, weatherConditions: conditions }
      persistState(next)
      return next
    }),

  setRepairExcludedCount: (count) =>
    set((s) => {
      const next = { ...s, repairExcludedCount: count }
      persistState(next)
      return next
    }),

  resetFilters: () => {
    persistState(defaultState)
    set(defaultState)
  },
}))
