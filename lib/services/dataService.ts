import {
  stations as mockStations,
  vehicles as mockVehicles,
  loadingTeams as mockTeams,
  weatherRecords as mockWeather,
  waybills as mockWaybills,
  scanRecords as mockScans,
  delayRecords as mockDelays,
  exceptions as mockExceptions,
} from '../data/mockData'
import type {
  FilterParams,
  StationAggregate,
  PathAggregate,
  DelayRecord,
  ExceptionRecord,
  ScanSequenceItem,
  UserPermission,
  TransferStation,
  Vehicle,
  LoadingTeam,
} from '../types'
import { sanitizeForPermission, isLowSample } from '../utils/business'
import { testDbConnection } from '../db/client'
import * as db from '../db/queries'

let useDb: boolean | null = null

export async function initDataMode(): Promise<boolean> {
  if (useDb !== null) return useDb
  useDb = await testDbConnection()
  if (useDb) {
    console.log('📊 Using PostgreSQL + PostGIS backend')
  } else {
    console.log('📊 Using in-memory mock data (PostgreSQL not available)')
  }
  return useDb
}

export function getDataMode(): boolean {
  return useDb === true
}

export async function getStations(): Promise<TransferStation[]> {
  await initDataMode()
  if (useDb) {
    return db.getStationsDb()
  }
  return mockStations
}

export async function getVehicles(): Promise<Vehicle[]> {
  await initDataMode()
  if (useDb) {
    return db.getVehiclesDb()
  }
  return mockVehicles
}

export async function getLoadingTeams(): Promise<LoadingTeam[]> {
  await initDataMode()
  if (useDb) {
    return db.getLoadingTeamsDb()
  }
  return mockTeams
}

function getWeatherForStationMock(stationId: string, timestamp: Date) {
  const stationWeather = mockWeather
    .filter(w => w.stationId === stationId)
    .sort((a, b) => {
      const diffA = Math.abs(new Date(a.timestamp).getTime() - timestamp.getTime())
      const diffB = Math.abs(new Date(b.timestamp).getTime() - timestamp.getTime())
      return diffA - diffB
    })
  return stationWeather[0]
}

function applyFiltersMock(
  params: FilterParams
): {
  filteredDelays: DelayRecord[]
  filteredWaybills: typeof mockWaybills
  filteredExceptions: ExceptionRecord[]
} {
  let filteredDelays = [...mockDelays]
  let filteredWaybills = [...mockWaybills]
  let filteredExceptions = [...mockExceptions]

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
      const wb = mockWaybills.find(w => w.id === e.waybillId)
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
      const station = mockStations.find(s => s.id === d.stationId)
      if (!station) return false
      return station.location.lng >= minLng && station.location.lng <= maxLng &&
             station.location.lat >= minLat && station.location.lat <= maxLat
    })
  }

  return { filteredDelays, filteredWaybills, filteredExceptions }
}

function getStationAggregatesMock(params: FilterParams): StationAggregate[] {
  const { filteredDelays, filteredExceptions } = applyFiltersMock(params)

  return mockStations.map(station => {
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
      .map(ts => getWeatherForStationMock(station.id, ts)?.condition)
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

function getPathAggregatesMock(params: FilterParams): PathAggregate[] {
  const { filteredDelays, filteredWaybills } = applyFiltersMock(params)

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
    const wb = mockWaybills.find(w => w.id === d.waybillId)
    if (!wb) return
    const key = `${wb.originStationId}_${wb.destStationId}`
    if (pathMap.has(key)) {
      pathMap.get(key)!.delays.push(d)
    }
  })

  const paths: PathAggregate[] = []
  
  pathMap.forEach((data) => {
    const origin = mockStations.find(s => s.id === data.originStationId)
    const dest = mockStations.find(s => s.id === data.destStationId)
    if (!origin || !dest) return

    const waybillCount = Array.from(data.waybillIds).length
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
      id: `${data.originStationId}_${data.destStationId}`,
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

function getScanSequenceForWaybillMock(waybillId: string): ScanSequenceItem[] {
  const scans = mockScans
    .filter(s => s.waybillId === waybillId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return scans.map((scan, idx) => {
    const station = mockStations.find(s => s.id === scan.stationId)!
    const weather = getWeatherForStationMock(scan.stationId, new Date(scan.timestamp))
    
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

function getExceptionsMock(params: FilterParams, permission: UserPermission): ExceptionRecord[] {
  const { filteredExceptions } = applyFiltersMock(params)
  
  if (!permission.canViewSensitive) {
    return filteredExceptions.map(e => 
      sanitizeForPermission(e, false, ['handlerId', 'description'])
    ) as ExceptionRecord[]
  }
  
  return filteredExceptions
}

function getDelayRecordsMock(params: FilterParams): DelayRecord[] {
  const { filteredDelays } = applyFiltersMock(params)
  return filteredDelays
}

function getWaybillWithDetailsMock(waybillId: string) {
  const wb = mockWaybills.find(w => w.id === waybillId)
  if (!wb) return null

  const vehicle = mockVehicles.find(v => v.id === wb.vehicleId)
  const originStation = mockStations.find(s => s.id === wb.originStationId)
  const destStation = mockStations.find(s => s.id === wb.destStationId)
  const delays = mockDelays.filter(d => d.waybillId === waybillId)
  const waybillExceptions = mockExceptions.filter(e => e.waybillId === waybillId)
  const scanSequence = getScanSequenceForWaybillMock(waybillId)

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

function getPathDetailsMock(pathId: string, params: FilterParams) {
  const [originId, destId] = pathId.split('_')
  const { filteredWaybills } = applyFiltersMock(params)
  
  const pathWaybills = filteredWaybills.filter(
    w => w.originStationId === originId && w.destStationId === destId
  )

  const withDetails = pathWaybills.map(wb => {
    const scans = getScanSequenceForWaybillMock(wb.id)
    const wbDelays = mockDelays.filter(d => d.waybillId === wb.id)
    return {
      waybill: wb,
      scanSequence: scans,
      delays: wbDelays,
    }
  })

  return withDetails
}

function getLoadingTeamPerformanceMock(params: FilterParams) {
  const { filteredDelays } = applyFiltersMock(params)
  
  return mockTeams.map(team => {
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
      stationName: mockStations.find(s => s.id === team.stationId)?.name || '',
      totalWaybills: total,
      delayedWaybills: delayed,
      delayRate: total > 0 ? delayed / total : 0,
      averageDurationMinutes: avgDuration,
      isLowSample: isLowSample(total),
    }
  }).filter(t => t.totalWaybills > 0)
}

export async function getStationAggregates(params: FilterParams): Promise<StationAggregate[]> {
  await initDataMode()
  if (useDb) {
    return db.getStationAggregatesDb(params)
  }
  return getStationAggregatesMock(params)
}

export async function getPathAggregates(params: FilterParams): Promise<PathAggregate[]> {
  await initDataMode()
  if (useDb) {
    return db.getPathAggregatesDb(params)
  }
  return getPathAggregatesMock(params)
}

export async function getExceptions(params: FilterParams, permission: UserPermission): Promise<ExceptionRecord[]> {
  await initDataMode()
  if (useDb) {
    const data = await db.getExceptionsDb(params)
    if (!permission.canViewSensitive) {
      return data.map(e => 
        sanitizeForPermission(e, false, ['handlerId', 'description'])
      ) as ExceptionRecord[]
    }
    return data
  }
  return getExceptionsMock(params, permission)
}

export async function getDelayRecords(params: FilterParams): Promise<DelayRecord[]> {
  await initDataMode()
  if (useDb) {
    return db.getDelayRecordsDb(params)
  }
  return getDelayRecordsMock(params)
}

export async function getScanSequenceForWaybill(waybillId: string): Promise<ScanSequenceItem[]> {
  await initDataMode()
  if (useDb) {
    return db.getScanSequenceDb(waybillId)
  }
  return getScanSequenceForWaybillMock(waybillId)
}

export async function getWaybillWithDetails(waybillId: string) {
  await initDataMode()
  if (useDb) {
    const stations = await db.getStationsDb()
    const vehicles = await db.getVehiclesDb()
    const delays = await getDelayRecords({})
    const exceptions = await getExceptions({}, getDefaultPermission('admin'))
    const allDelays = delays
    const allExceptions = exceptions
    const scanSequence = await getScanSequenceForWaybill(waybillId)
    
    const wb = (await (async () => {
      const sql = (await import('../db/client')).getDbClient()
      const result = await sql`SELECT * FROM waybills WHERE id = ${waybillId}`
      return result[0] ? {
        id: result[0].id,
        waybillNumber: result[0].waybill_number,
        originStationId: result[0].origin_station_id,
        destStationId: result[0].dest_station_id,
        vehicleId: result[0].vehicle_id,
        createdTime: result[0].created_time,
        estimatedArrival: result[0].estimated_arrival,
        actualArrival: result[0].actual_arrival,
        status: result[0].status,
        priority: result[0].priority,
      } : null
    })())
    
    if (!wb) return null

    return {
      waybill: wb,
      vehicle: vehicles.find(v => v.id === wb.vehicleId),
      originStation: stations.find(s => s.id === wb.originStationId),
      destStation: stations.find(s => s.id === wb.destStationId),
      delays: allDelays.filter(d => d.waybillId === waybillId),
      exceptions: allExceptions.filter(e => e.waybillId === waybillId),
      scanSequence,
    }
  }
  return getWaybillWithDetailsMock(waybillId)
}

export async function getPathDetails(pathId: string, params: FilterParams) {
  await initDataMode()
  if (useDb) {
    const [originId, destId] = pathId.split('_')
    const sql = (await import('../db/client')).getDbClient()
    const waybills = await sql`
      SELECT w.id, w.status, w.priority
      FROM waybills w
      WHERE w.origin_station_id = ${originId} AND w.dest_station_id = ${destId}
      LIMIT 20
    `
    
    const details = await Promise.all(
      waybills.map(async (wb: any) => ({
        waybill: { id: wb.id, status: wb.status, priority: wb.priority },
        scanSequence: await getScanSequenceForWaybill(wb.id),
        delays: await getDelayRecords({ ...params, stationIds: [originId] })
          .then(ds => ds.filter(d => d.waybillId === wb.id)),
      }))
    )
    return details
  }
  return getPathDetailsMock(pathId, params)
}

export async function getLoadingTeamPerformance(params: FilterParams) {
  await initDataMode()
  if (useDb) {
    return db.getLoadingTeamPerformanceDb(params)
  }
  return getLoadingTeamPerformanceMock(params)
}

export async function getExportData(params: FilterParams) {
  const stationAggr = await getStationAggregates(params)
  const paths = await getPathAggregates(params)
  const delays = await getDelayRecords(params)
  const teamPerformance = await getLoadingTeamPerformance(params)
  const stations = await getStations()
  const vehicles = await getVehicles()
  const teams = await getLoadingTeams()

  return {
    exportDate: new Date().toISOString(),
    filters: params,
    spatialBounds: params.spatialBounds,
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
      loadingTeamName: d.loadingTeamId ? teams.find(t => t.id === d.loadingTeamId)?.name : null,
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
