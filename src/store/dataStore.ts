import { create } from 'zustand'
import {
  AggregatedStation,
  Ride,
  Dispatch,
  RepairRecord,
  Weather,
  StationAlert,
  WeeklyReportData,
} from '@/types'
import { runETL, applyFilters, computeAlerts, computeFlows } from '@/data/etl'
import { getCache, setCache, clearCache } from '@/data/cache'
import { useFilterStore } from '@/store/filterStore'

interface DataStoreState {
  stations: AggregatedStation[]
  rides: Ride[]
  dispatches: Dispatch[]
  repairs: RepairRecord[]
  weather: Weather[]
  alerts: StationAlert[]
  filteredStations: AggregatedStation[]
  filteredRides: Ride[]
  filteredDispatches: Dispatch[]
  isLoading: boolean
  isDataLoaded: boolean
  sampleSize: number
  nullCount: number
}

interface DataStoreActions {
  loadData: () => Promise<void>
  refreshFilters: () => void
  generateWeeklyReport: () => WeeklyReportData
}

type DataStore = DataStoreState & DataStoreActions

const defaultState: DataStoreState = {
  stations: [],
  rides: [],
  dispatches: [],
  repairs: [],
  weather: [],
  alerts: [],
  filteredStations: [],
  filteredRides: [],
  filteredDispatches: [],
  isLoading: false,
  isDataLoaded: false,
  sampleSize: 0,
  nullCount: 0,
}

export const useDataStore = create<DataStore>()((set, get) => ({
  ...defaultState,

  loadData: async () => {
    set({ isLoading: true })

    const cachedData = getCache<{
      stations: AggregatedStation[]
      rides: Ride[]
      dispatches: Dispatch[]
      repairs: RepairRecord[]
      weather: Weather[]
    }>('etl_result')
    if (cachedData && cachedData.stations.length > 0) {
      const stationsWithFlows = computeFlows(cachedData.stations, cachedData.rides)
      set({
        stations: stationsWithFlows,
        rides: cachedData.rides,
        dispatches: cachedData.dispatches,
        repairs: cachedData.repairs,
        weather: cachedData.weather,
        filteredStations: stationsWithFlows,
        filteredRides: cachedData.rides,
        filteredDispatches: cachedData.dispatches,
        isLoading: false,
        isDataLoaded: true,
      })
      return
    }

    try {
      const result = await runETL()

      setCache('etl_result', {
        stations: result.stations,
        rides: result.rides,
        dispatches: result.dispatches,
        repairs: result.repairs,
        weather: result.weather,
      }, 5 * 60 * 1000, true)

      set({
        stations: result.stations,
        rides: result.rides,
        dispatches: result.dispatches,
        repairs: result.repairs,
        weather: result.weather,
        filteredStations: result.stations,
        filteredRides: result.rides,
        filteredDispatches: result.dispatches,
        nullCount: result.nullCount,
        isLoading: false,
        isDataLoaded: true,
      })
    } catch {
      clearCache()
      set({ isLoading: false })
    }
  },

  refreshFilters: () => {
    const state = get()
    const filterState = useFilterStore.getState()
    const filtered = applyFilters(
      {
        stations: state.stations,
        rides: state.rides,
        dispatches: state.dispatches,
        repairs: state.repairs,
        weather: state.weather,
      },
      filterState,
    )
    const alerts = computeAlerts(filtered.stations)
    let repairExcluded = 0
    if (filterState.vehicleStatus === 'dispatchable') {
      repairExcluded = state.stations.reduce((sum, s) => sum + s.bikesInRepair, 0)
    }
    useFilterStore.getState().setRepairExcludedCount(repairExcluded)
    set({
      filteredStations: filtered.stations,
      filteredRides: filtered.rides,
      filteredDispatches: filtered.dispatches,
      alerts,
      sampleSize: filtered.rides.length,
    })
  },

  generateWeeklyReport: () => {
    const state = get()
    const filterState = useFilterStore.getState()

    const now = new Date()
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - diffToMonday)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const avgAvailability =
      state.filteredStations.length > 0
        ? state.filteredStations.reduce((sum, s) => sum + s.availableBikesForDispatch, 0) /
          state.filteredStations.length
        : 0

    const criticalAlerts = state.alerts.filter((a) => a.severity === 'critical').length

    const mockWoW = Math.round((Math.random() * 10 + 5) * 100) / 100
    const mockYoY = Math.round((Math.random() * 10 + 5) * 100) / 100

    const sortedByDeviation = [...state.filteredStations]
      .sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow))
      .slice(0, 3)

    const anomalies = sortedByDeviation.map((s) => ({
      stationId: s.id,
      stationName: s.name,
      metric: 'netFlow',
      expected: 0,
      actual: s.netFlow,
      deviation: Math.abs(s.netFlow),
    }))

    return {
      weekStart: weekStart.toISOString().slice(0, 10),
      weekEnd: weekEnd.toISOString().slice(0, 10),
      totalRides: state.filteredRides.length,
      totalDispatches: state.filteredDispatches.length,
      avgAvailability,
      criticalAlerts,
      ridesWoW: mockWoW,
      ridesYoY: mockYoY,
      availabilityWoW: Math.round((Math.random() * 10 + 5) * 100) / 100,
      anomalies,
      filterSnapshot: filterState,
      nullCount: state.nullCount,
    }
  },
}))
