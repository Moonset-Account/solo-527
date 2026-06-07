import { create } from 'zustand'
import {
  AggregatedStation,
  Ride,
  Dispatch,
  RepairRecord,
  Weather,
  StationAlert,
  WeeklyReportData,
  Route,
} from '@/types'
import { runETL, applyFilters, computeAlerts, computeFlows, deriveRoutes } from '@/data/etl'
import { getCache, setCache, clearCache } from '@/data/cache'
import { useFilterStore } from '@/store/filterStore'

interface DataStoreState {
  stations: AggregatedStation[]
  rides: Ride[]
  dispatches: Dispatch[]
  repairs: RepairRecord[]
  weather: Weather[]
  routes: Route[]
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
  routes: [],
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
      const stationMap = new Map(cachedData.stations.map((s) => [s.id, s.name]))
      const routes = deriveRoutes(cachedData.rides, stationMap)
      set({
        stations: stationsWithFlows,
        rides: cachedData.rides,
        dispatches: cachedData.dispatches,
        repairs: cachedData.repairs,
        weather: cachedData.weather,
        routes,
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
        routes: deriveRoutes(result.rides, new Map(result.stations.map((s) => [s.id, s.name]))),
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
    } else if (filterState.vehicleStatus === 'in_repair') {
      repairExcluded = state.stations.reduce((sum, s) => sum + s.availableBikesForDispatch, 0)
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

    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(weekStart.getDate() - 7)
    const prevWeekEnd = new Date(weekEnd)
    prevWeekEnd.setDate(weekEnd.getDate() - 7)

    const weekStartMs = weekStart.getTime()
    const weekEndMs = weekEnd.getTime()
    const prevWeekStartMs = prevWeekStart.getTime()
    const prevWeekEndMs = prevWeekEnd.getTime()

    const thisWeekRides = state.rides.filter((r) => {
      const t = new Date(r.startTime).getTime()
      return t >= weekStartMs && t <= weekEndMs
    })
    const prevWeekRides = state.rides.filter((r) => {
      const t = new Date(r.startTime).getTime()
      return t >= prevWeekStartMs && t <= prevWeekEndMs
    })

    const ridesWoW =
      prevWeekRides.length > 0
        ? Math.round(((thisWeekRides.length - prevWeekRides.length) / prevWeekRides.length) * 10000) / 100
        : 0

    const firstRideDate = state.rides.length > 0
      ? new Date(state.rides.reduce((min, r) => r.startTime < min ? r.startTime : min, state.rides[0].startTime))
      : now
    const dataSpanDays = Math.max(1, Math.round((now.getTime() - firstRideDate.getTime()) / (1000 * 60 * 60 * 24)))
    const yoyOffsetDays = Math.max(dataSpanDays, 7)
    const yoyStart = new Date(weekStart)
    yoyStart.setDate(weekStart.getDate() - yoyOffsetDays)
    const yoyEnd = new Date(weekEnd)
    yoyEnd.setDate(weekEnd.getDate() - yoyOffsetDays)
    const yoyStartMs = yoyStart.getTime()
    const yoyEndMs = yoyEnd.getTime()

    const yoyPeriodRides = state.rides.filter((r) => {
      const t = new Date(r.startTime).getTime()
      return t >= yoyStartMs && t <= yoyEndMs
    })

    const ridesYoY =
      yoyPeriodRides.length > 0
        ? Math.round(((thisWeekRides.length - yoyPeriodRides.length) / yoyPeriodRides.length) * 10000) / 100
        : 0

    const thisWeekDispatches = state.filteredDispatches.filter((d) => {
      const t = new Date(d.dispatchTime).getTime()
      return t >= weekStartMs && t <= weekEndMs
    })
    const prevWeekDispatches = state.dispatches.filter((d) => {
      const t = new Date(d.dispatchTime).getTime()
      return t >= prevWeekStartMs && t <= prevWeekEndMs
    })

    const dispatchWoW =
      prevWeekDispatches.length > 0
        ? Math.round(((thisWeekDispatches.length - prevWeekDispatches.length) / prevWeekDispatches.length) * 10000) / 100
        : 0

    const avgAvailability =
      state.filteredStations.length > 0
        ? state.filteredStations.reduce((sum, s) => sum + s.availableBikesForDispatch, 0) /
          state.filteredStations.length
        : 0

    const prevWeekStations = computeFlows(
      state.stations,
      prevWeekRides,
    )
    const prevAvgAvailability =
      prevWeekStations.length > 0
        ? prevWeekStations.reduce((sum, s) => sum + s.availableBikesForDispatch, 0) /
          prevWeekStations.length
        : 0

    const availabilityWoW =
      prevAvgAvailability > 0
        ? Math.round(((avgAvailability - prevAvgAvailability) / prevAvgAvailability) * 10000) / 100
        : 0

    const criticalAlerts = state.alerts.filter((a) => a.severity === 'critical').length

    const sortedByDeviation = [...state.filteredStations]
      .sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow))
      .slice(0, 3)

    const avgNetFlow =
      state.filteredStations.length > 0
        ? state.filteredStations.reduce((sum, s) => sum + Math.abs(s.netFlow), 0) / state.filteredStations.length
        : 0

    const anomalies = sortedByDeviation.map((s) => ({
      stationId: s.id,
      stationName: s.name,
      metric: 'netFlow',
      expected: Math.round(avgNetFlow * 10) / 10,
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
      ridesWoW,
      ridesYoY,
      availabilityWoW,
      dispatchWoW,
      anomalies,
      filterSnapshot: filterState,
      nullCount: state.nullCount,
    }
  },
}))
