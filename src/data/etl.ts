import type {
  Station,
  Ride,
  Dispatch,
  RepairRecord,
  Weather,
  AggregatedStation,
  FilterState,
  StationAlert,
  Route,
} from '@/types'
import { stations as mockStations } from '@/data/mock/stations'
import { rides as mockRides } from '@/data/mock/rides'
import { dispatches as mockDispatches } from '@/data/mock/dispatches'
import { repairs as mockRepairs } from '@/data/mock/repairs'
import { weather as mockWeather } from '@/data/mock/weather'

export function extractAll() {
  return {
    stations: mockStations,
    rides: mockRides,
    dispatches: mockDispatches,
    repairs: mockRepairs,
    weather: mockWeather,
  }
}

export function transformStations(
  stations: Station[],
  repairs: RepairRecord[],
): AggregatedStation[] {
  const repairCountMap = new Map<string, number>()
  for (const r of repairs) {
    if (r.status === 'repairing') {
      repairCountMap.set(
        r.stationId,
        (repairCountMap.get(r.stationId) ?? 0) + 1,
      )
    }
  }

  return stations.map((station) => {
    const bikesInRepair =
      repairCountMap.get(station.id) ?? station.bikesInRepair
    const availableBikesForDispatch = Math.max(
      0,
      station.availableBikes - bikesInRepair,
    )
    const repairRatio =
      station.totalDocks > 0 ? bikesInRepair / station.totalDocks : 0
    return {
      ...station,
      bikesInRepair,
      availableBikesForDispatch,
      inflow: 0,
      outflow: 0,
      netFlow: 0,
      repairRatio,
    }
  })
}

export function transformRides(rides: Ride[]): { rides: Ride[]; nullCount: number } {
  let nullCount = 0
  const cleaned = rides.filter((ride) => {
    if (!ride.originStationId || !ride.destStationId) {
      nullCount++
      return false
    }
    if (!ride.startTime) nullCount++
    return true
  })
  return { rides: cleaned, nullCount }
}

export function computeFlows(
  stations: AggregatedStation[],
  rides: Ride[],
): AggregatedStation[] {
  const inflowMap = new Map<string, number>()
  const outflowMap = new Map<string, number>()

  for (const ride of rides) {
    outflowMap.set(
      ride.originStationId,
      (outflowMap.get(ride.originStationId) ?? 0) + 1,
    )
    inflowMap.set(
      ride.destStationId,
      (inflowMap.get(ride.destStationId) ?? 0) + 1,
    )
  }

  return stations.map((station) => {
    const inflow = inflowMap.get(station.id) ?? 0
    const outflow = outflowMap.get(station.id) ?? 0
    return {
      ...station,
      inflow,
      outflow,
      netFlow: inflow - outflow,
    }
  })
}

export async function runETL() {
  const { stations, rides, dispatches, repairs, weather } = extractAll()
  const aggregatedStations = transformStations(stations, repairs)
  const { rides: cleanedRides, nullCount } = transformRides(rides)
  const stationsWithFlows = computeFlows(aggregatedStations, cleanedRides)
  return {
    stations: stationsWithFlows,
    rides: cleanedRides,
    dispatches,
    repairs,
    weather,
    nullCount,
  }
}

export function deriveRoutes(
  rides: Ride[],
  stationMap: Map<string, string>,
): Route[] {
  const seen = new Set<string>()
  const routes: Route[] = []
  for (const r of rides) {
    const key = `${r.originStationId}->${r.destStationId}`
    if (seen.has(key)) continue
    seen.add(key)
    routes.push({
      id: key,
      originId: r.originStationId,
      originName: stationMap.get(r.originStationId) ?? r.originStationId,
      destId: r.destStationId,
      destName: stationMap.get(r.destStationId) ?? r.destStationId,
    })
  }
  return routes
}

export function applyFilters(
  data: {
    stations: AggregatedStation[]
    rides: Ride[]
    dispatches: Dispatch[]
    repairs: RepairRecord[]
    weather: Weather[]
  },
  filters: FilterState,
) {
  let { stations, rides, dispatches } = data
  const { repairs, weather } = data

  if (filters.stationIds.length > 0) {
    stations = stations.filter((s) =>
      filters.stationIds.includes(s.id),
    )
  }

  if (filters.routeIds.length > 0) {
    rides = rides.filter((r) =>
      filters.routeIds.includes(`${r.originStationId}->${r.destStationId}`),
    )
  }

  if (filters.stationIds.length > 0) {
    rides = rides.filter(
      (r) =>
        filters.stationIds.includes(r.originStationId) ||
        filters.stationIds.includes(r.destStationId),
    )
    dispatches = dispatches.filter(
      (d) =>
        filters.stationIds.includes(d.fromStationId) ||
        filters.stationIds.includes(d.toStationId),
    )
  }

  if (filters.routeIds.length > 0) {
    const routeStationPairs = new Set(
      filters.routeIds.map((rid) => {
        const parts = rid.split('->')
        return parts.length === 2 ? `${parts[0]},${parts[1]}` : ''
      }).filter(Boolean),
    )
    if (routeStationPairs.size > 0) {
      dispatches = dispatches.filter((d) =>
        routeStationPairs.has(`${d.fromStationId},${d.toStationId}`),
      )
    }
  }

  if (filters.timePeriod === 'morning_rush') {
    rides = rides.filter((r) => {
      const hour = new Date(r.startTime).getHours()
      return hour >= 7 && hour < 9
    })
    dispatches = dispatches.filter((d) => {
      const hour = new Date(d.dispatchTime).getHours()
      return hour >= 7 && hour < 9
    })
  } else if (filters.timePeriod === 'evening_rush') {
    rides = rides.filter((r) => {
      const hour = new Date(r.startTime).getHours()
      return hour >= 17 && hour < 19
    })
    dispatches = dispatches.filter((d) => {
      const hour = new Date(d.dispatchTime).getHours()
      return hour >= 17 && hour < 19
    })
  } else if (filters.timePeriod === 'custom' && filters.customTimeRange) {
    const [start, end] = filters.customTimeRange
    const startMs = new Date(start).getTime()
    const endMs = new Date(end).getTime()
    rides = rides.filter((r) => {
      const rideMs = new Date(r.startTime).getTime()
      return rideMs >= startMs && rideMs <= endMs
    })
    dispatches = dispatches.filter((d) => {
      const dispatchMs = new Date(d.dispatchTime).getTime()
      return dispatchMs >= startMs && dispatchMs <= endMs
    })
  }

  if (filters.weatherConditions.length > 0) {
    const weatherMap = new Map(weather.map((w) => [w.id, w.condition]))
    rides = rides.filter((r) => {
      const condition = weatherMap.get(r.weatherId)
      return condition != null && filters.weatherConditions.includes(condition as string)
    })
  }

  if (filters.dispatchStatus !== 'all') {
    dispatches = dispatches.filter(
      (d) => d.status === filters.dispatchStatus,
    )
  }

  if (filters.vehicleStatus === 'dispatchable') {
    stations = stations.map((s) => ({
      ...s,
      availableBikes: s.availableBikesForDispatch,
      bikesInRepair: 0,
    }))
  } else if (filters.vehicleStatus === 'in_repair') {
    stations = stations
      .filter((s) => s.bikesInRepair > 0)
      .map((s) => ({
        ...s,
        availableBikes: s.bikesInRepair,
        availableBikesForDispatch: 0,
      }))
  }

  stations = computeFlows(stations, rides)

  return { stations, rides, dispatches, repairs, weather }
}

export function computeAlerts(
  stations: AggregatedStation[],
): StationAlert[] {
  const alerts: StationAlert[] = []

  for (const station of stations) {
    if (station.availableBikesForDispatch < 3) {
      alerts.push({
        stationId: station.id,
        stationName: station.name,
        type: 'low_stock',
        severity: 'critical',
        message: `仅剩 ${station.availableBikesForDispatch} 辆可调度车辆`,
        value: station.availableBikesForDispatch,
        threshold: 3,
      })
    } else if (station.availableBikesForDispatch < 5) {
      alerts.push({
        stationId: station.id,
        stationName: station.name,
        type: 'low_stock',
        severity: 'warning',
        message: `可调度车辆不足 ${station.availableBikesForDispatch} 辆`,
        value: station.availableBikesForDispatch,
        threshold: 5,
      })
    }

    if (station.repairRatio > 0.3) {
      alerts.push({
        stationId: station.id,
        stationName: station.name,
        type: 'high_repair_ratio',
        severity: 'critical',
        message: `维修比例高达 ${(station.repairRatio * 100).toFixed(1)}%`,
        value: station.repairRatio,
        threshold: 0.3,
      })
    } else if (station.repairRatio > 0.2) {
      alerts.push({
        stationId: station.id,
        stationName: station.name,
        type: 'high_repair_ratio',
        severity: 'warning',
        message: `维修比例偏高 ${(station.repairRatio * 100).toFixed(1)}%`,
        value: station.repairRatio,
        threshold: 0.2,
      })
    }

    if (station.netFlow < -5) {
      alerts.push({
        stationId: station.id,
        stationName: station.name,
        type: 'supply_demand_imbalance',
        severity: 'critical',
        message: `净流出 ${station.netFlow}，供需严重失衡`,
        value: station.netFlow,
        threshold: -5,
      })
    } else if (station.netFlow < -3) {
      alerts.push({
        stationId: station.id,
        stationName: station.name,
        type: 'supply_demand_imbalance',
        severity: 'warning',
        message: `净流出 ${station.netFlow}，供需失衡`,
        value: station.netFlow,
        threshold: -3,
      })
    }
  }

  return alerts
}
