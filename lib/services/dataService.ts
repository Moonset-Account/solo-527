import {
  stations,
  vehicles,
  loadingTeams,
  weatherRecords,
  waybills,
  scanRecords,
  delayRecords,
  exceptions,
} from '../data/mockData'
import type {
  FilterParams,
  StationAggregate,
  PathAggregate,
  DelayRecord,
  ExceptionRecord,
  ScanSequenceItem,
  UserPermission,
} from '../types'
import { getBusinessDay, shouldAttributeToTeam, sanitizeForPermission, isLowSample } from '../utils/business'

export function getStations() {
  return stations
}

export function getVehicles() {
  return vehicles
}

export function getLoadingTeams() {
  return loadingTeams
}

export function getWeatherForStation(stationId: string, timestamp: Date) {
  const stationWeather = weatherRecords
    .filter(w => w.stationId === stationId)
    .sort((a, b) => {
      const diffA = Math.abs(new Date(a.timestamp).getTime() - timestamp.getTime())
      const diffB = Math.abs(new Date(b.timestamp).getTime() - timestamp.getTime())
      return diffA - diffB
    })
  return stationWeather[0]
}

function applyFilters(
  params: FilterParams
): {
  filteredDelays: DelayRecord[]
  filteredWaybills: typeof waybills
  filteredExceptions: ExceptionRecord[]
} {
  let filteredDelays = [...delayRecords]
  let filteredWaybills = [...waybills]
  let filteredExceptions = [...exceptions]

  if (params.startDate) {
    const start = new Date(params.startDate)
    filteredDelays = filteredDelays.filter(d => new Date(d.arrivalTime) >= start)
    filteredWaybills = filteredWaybills.filter(w => new Date(w.createdTime) >= start)
    filteredExceptions = filteredExceptions.filter(e => new Date(e.timestamp) >= start)
  }

  if (params.endDate) {
    const end = new Date(params.endDate)
    end.setHours(23, 59, 59)
    filteredDelays = filteredDelays.filter(d => new Date(d.arrivalTime) <= end)
    filteredWaybills = filteredWaybills.filter(w => new Date(w.createdTime) <= end)
    filteredExceptions = filteredExceptions.filter(e => new Date(e.timestamp) <= end)
  }

  if (params.stationIds && params.stationIds.length > 0) {
    filteredDelays = filteredDelays.filter(d => params.stationIds!.includes(d.stationId))
    filteredWaybills = filteredWaybills.filter(w => 
      params.stationIds!.includes(w.originStationId) || params.stationIds!.includes(w.destStationId)
    )
    filteredExceptions = filteredExceptions.filter(e => params.stationIds!.includes(e.stationId))
  }

  if (params.vehicleIds && params.vehicleIds.length > 0) {
    filteredDelays = filteredDelays.filter(d => params.vehicleIds!.includes(d.vehicleId))
    filteredWaybills = filteredWaybills.filter(w => params.vehicleIds!.includes(w.vehicleId))
    filteredExceptions = filteredExceptions.filter(e => {
      const wb = waybills.find(w => w.id === e.waybillId)
      return wb && params.vehicleIds!.includes(wb.vehicleId)
    })
  }

  if (params.teamIds && params.teamIds.length > 0) {
    filteredDelays = filteredDelays.filter(d => 
      d.loadingTeamId && params.teamIds!.includes(d.loadingTeamId)
    )
  }

  if (params.delayCategories && params.delayCategories.length > 0) {
    filteredDelays = filteredDelays.filter(d => 
      d.delayCategory && params.delayCategories!.includes(d.delayCategory)
    )
  }

  if (params.severityLevels && params.severityLevels.length > 0) {
    filteredExceptions = filteredExceptions.filter(e => 
      params.severityLevels!.includes(e.severity)
    )
  }

  if (params.minDelayMinutes) {
    filteredDelays = filteredDelays.filter(d => d.durationMinutes >= params.minDelayMinutes!)
  }

  if (params.spatialBounds) {
    const { minLng, maxLng, minLat, maxLat } = params.spatialBounds
    filteredDelays = filteredDelays.filter(d => {
      const station = stations.find(s => s.id === d.stationId)
      if (!station) return false
      return station.location.lng >= minLng && station.location.lng <= maxLng &&
             station.location.lat >= minLat && station.location.lat <= maxLat
    })
  }

  return { filteredDelays, filteredWaybills, filteredExceptions }
}

export function getStationAggregates(params: FilterParams): StationAggregate[] {
  const { filteredDelays, filteredExceptions } = applyFilters(params)

  return stations.map(station => {
    const stationDelays = filteredDelays.filter(d => d.stationId === station.id)
    const stationExceptions = filteredExceptions.filter(e => e.stationId === station.id)
    
    const totalWaybills = stationDelays.length
    const delayedWaybills = stationDelays.filter(d => d.isDelayed).length
    const averageDurationMinutes = totalWaybills > 0
      ? stationDelays.reduce((sum, d) => sum + d.durationMinutes, 0) / totalWaybills
      : 0
    const delayRate = totalWaybills > 0 ? delayedWaybills / totalWaybills : 0

    const timestamps = stationDelays.map(d => new Date(d.arrivalTime))
    const weatherConditions = timestamps
      .map(ts => getWeatherForStation(station.id, ts)?.condition)
      .filter(Boolean) as string[]

    return {
      stationId: station.id,
      stationName: station.name,
      location: station.location,
      totalWaybills,
      delayedWaybills,
      averageDurationMinutes,
      delayRate,
      exceptions: stationExceptions.length,
      weatherConditions: Array.from(new Set(weatherConditions)) as any,
    }
  })
}

export function getPathAggregates(params: FilterParams): PathAggregate[] {
  const { filteredDelays, filteredWaybills } = applyFilters(params)

  const pathMap = new Map<string, {
    originStationId: string
    destStationId: string
    waybillIds: Set<string>
    delays: DelayRecord[]
  }>()

  filteredWaybills.forEach(wb => {
    const key = `${wb.originStationId}_${wb.destStationId}`
    if (!pathMap.has(key)) {
      pathMap.set(key, {
        originStationId: wb.originStationId,
        destStationId: wb.destStationId,
        waybillIds: new Set(),
        delays: [],
      })
    }
    pathMap.get(key)!.waybillIds.add(wb.id)
  })

  filteredDelays.forEach(d => {
    const wb = waybills.find(w => w.id === d.waybillId)
    if (!wb) return
    const key = `${wb.originStationId}_${wb.destStationId}`
    if (pathMap.has(key)) {
      pathMap.get(key)!.delays.push(d)
    }
  })

  const paths: PathAggregate[] = []
  
  pathMap.forEach((data, key) => {
    const origin = stations.find(s => s.id === data.originStationId)
    const dest = stations.find(s => s.id === data.destStationId)
    if (!origin || !dest) return

    const waybillCount = data.waybillIds.size
    const delayCount = data.delays.filter(d => d.isDelayed).length
    const averageDurationMinutes = data.delays.length > 0
      ? data.delays.reduce((sum, d) => sum + d.durationMinutes, 0) / data.delays.length
      : 0

    const delayedWbs = data.delays.filter(d => d.isDelayed).map(d => d.waybillId)
    const delaysForCalc = filteredDelays.filter(d => 
      delayedWbs.includes(d.waybillId) && d.stationId === data.originStationId
    )
    const averageDelayMinutes = delaysForCalc.length > 0
      ? delaysForCalc.reduce((sum, d) => sum + Math.max(0, d.durationMinutes - 60), 0) / delaysForCalc.length
      : 0

    const categoryCounts: Record<string, number> = {}
    data.delays.forEach(d => {
      if (d.delayCategory) {
        categoryCounts[d.delayCategory] = (categoryCounts[d.delayCategory] || 0) + 1
      }
    })
    const topReasons = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))

    const midLng = (origin.location.lng + dest.location.lng) / 2
    const midLat = (origin.location.lat + dest.location.lat) / 2 + (Math.random() - 0.5) * 2

    paths.push({
      id: key,
      originStationId: data.originStationId,
      destStationId: data.destStationId,
      originName: origin.name,
      destName: dest.name,
      waybillCount,
      delayCount,
      averageDurationMinutes,
      averageDelayMinutes,
      path: [origin.location, { lng: midLng, lat: midLat }, dest.location],
      isDelayed: delayCount > waybillCount * 0.2,
      topReasons,
    })
  })

  return paths
}

export function getExceptions(params: FilterParams, permission: UserPermission): ExceptionRecord[] {
  const { filteredExceptions } = applyFilters(params)
  
  if (!permission.canViewSensitive) {
    return filteredExceptions.map(e => 
      sanitizeForPermission(e, false, ['handlerId', 'description'])
    ) as ExceptionRecord[]
  }
  
  return filteredExceptions
}

export function getDelayRecords(params: FilterParams): DelayRecord[] {
  const { filteredDelays } = applyFilters(params)
  return filteredDelays
}

export function getScanSequenceForWaybill(waybillId: string): ScanSequenceItem[] {
  const scans = scanRecords
    .filter(s => s.waybillId === waybillId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return scans.map((scan, idx) => {
    const station = stations.find(s => s.id === scan.stationId)!
    const weather = getWeatherForStation(scan.stationId, new Date(scan.timestamp))
    
    let durationToNext: number | undefined
    if (idx < scans.length - 1) {
      const nextScan = scans[idx + 1]
      durationToNext = Math.round(
        (new Date(nextScan.timestamp).getTime() - new Date(scan.timestamp).getTime()) / (1000 * 60)
      )
    }

    return {
      scan,
      station,
      weather,
      durationToNext,
    }
  })
}

export function getWaybillWithDetails(waybillId: string) {
  const wb = waybills.find(w => w.id === waybillId)
  if (!wb) return null

  const vehicle = vehicles.find(v => v.id === wb.vehicleId)
  const originStation = stations.find(s => s.id === wb.originStationId)
  const destStation = stations.find(s => s.id === wb.destStationId)
  const delays = delayRecords.filter(d => d.waybillId === waybillId)
  const waybillExceptions = exceptions.filter(e => e.waybillId === waybillId)
  const scanSequence = getScanSequenceForWaybill(waybillId)

  return {
    waybill: wb,
    vehicle,
    originStation,
    destStation,
    delays,
    exceptions: waybillExceptions,
    scanSequence,
  }
}

export function getPathDetails(pathId: string, params: FilterParams) {
  const [originId, destId] = pathId.split('_')
  const { filteredWaybills } = applyFilters(params)
  
  const pathWaybills = filteredWaybills.filter(
    w => w.originStationId === originId && w.destStationId === destId
  )

  const withDetails = pathWaybills.map(wb => {
    const scans = getScanSequenceForWaybill(wb.id)
    const wbDelays = delayRecords.filter(d => d.waybillId === wb.id)
    return {
      waybill: wb,
      scanSequence: scans,
      delays: wbDelays,
    }
  })

  return withDetails
}

export function getLoadingTeamPerformance(params: FilterParams) {
  const { filteredDelays } = applyFilters(params)
  
  return loadingTeams.map(team => {
    const teamDelays = filteredDelays.filter(
      d => d.loadingTeamId === team.id && d.attributedToTeam
    )
    const total = teamDelays.length
    const delayed = teamDelays.filter(d => d.isDelayed).length
    const avgDuration = total > 0 
      ? teamDelays.reduce((sum, d) => sum + d.durationMinutes, 0) / total 
      : 0

    return {
      teamId: team.id,
      teamName: team.name,
      stationId: team.stationId,
      stationName: stations.find(s => s.id === team.stationId)?.name || '',
      totalWaybills: total,
      delayedWaybills: delayed,
      delayRate: total > 0 ? delayed / total : 0,
      averageDurationMinutes: avgDuration,
      isLowSample: isLowSample(total),
    }
  }).filter(t => t.totalWaybills > 0)
}

export function getExportData(params: FilterParams) {
  const stationAggr = getStationAggregates(params)
  const paths = getPathAggregates(params)
  const delays = getDelayRecords(params)
  const teamPerformance = getLoadingTeamPerformance(params)

  return {
    exportDate: new Date().toISOString(),
    filters: params,
    summary: {
      totalStations: stationAggr.filter(s => s.totalWaybills > 0).length,
      totalWaybills: stationAggr.reduce((sum, s) => sum + s.totalWaybills, 0),
      totalDelayed: stationAggr.reduce((sum, s) => sum + s.delayedWaybills, 0),
      overallDelayRate: stationAggr.reduce((sum, s) => sum + s.totalWaybills, 0) > 0
        ? stationAggr.reduce((sum, s) => sum + s.delayedWaybills, 0) / stationAggr.reduce((sum, s) => sum + s.totalWaybills, 0)
        : 0,
    },
    stations: stationAggr.filter(s => s.totalWaybills > 0),
    paths: paths,
    delays: delays.map(d => ({
      ...d,
      stationName: stations.find(s => s.id === d.stationId)?.name,
      vehiclePlate: vehicles.find(v => v.id === d.vehicleId)?.plateNumber,
      loadingTeamName: d.loadingTeamId ? loadingTeams.find(t => t.id === d.loadingTeamId)?.name : null,
    })),
    teamPerformance,
  }
}

export function getDefaultPermission(role: UserPermission['role'] = 'viewer'): UserPermission {
  const roles: Record<UserPermission['role'], UserPermission> = {
    admin: {
      role: 'admin',
      canViewDetails: true,
      canExport: true,
      canViewSensitive: true,
      accessibleStationIds: null,
    },
    dispatcher: {
      role: 'dispatcher',
      canViewDetails: true,
      canExport: true,
      canViewSensitive: false,
      accessibleStationIds: null,
    },
    viewer: {
      role: 'viewer',
      canViewDetails: false,
      canExport: false,
      canViewSensitive: false,
      accessibleStationIds: null,
    },
  }
  return roles[role]
}
