import { getDbClient } from './client'
import type { FilterParams, StationAggregate, PathAggregate, DelayRecord, ExceptionRecord, ScanSequenceItem } from '../types'
import { isLowSample } from '../utils/business'

function buildWhereClauses(filterParams: FilterParams, tablePrefix = ''): {
  clauses: string[]
  values: any[]
} {
  const clauses: string[] = []
  const values: any[] = []
  let paramIdx = 1

  if (filterParams.startDate) {
    clauses.push(`${tablePrefix}arrival_time >= $${paramIdx}`)
    values.push(filterParams.startDate)
    paramIdx++
  }
  if (filterParams.endDate) {
    clauses.push(`${tablePrefix}arrival_time <= $${paramIdx}`)
    values.push(filterParams.endDate + ' 23:59:59')
    paramIdx++
  }
  if (filterParams.stationIds && filterParams.stationIds.length > 0) {
    clauses.push(`${tablePrefix}station_id = ANY($${paramIdx})`)
    values.push(filterParams.stationIds)
    paramIdx++
  }
  if (filterParams.vehicleIds && filterParams.vehicleIds.length > 0) {
    clauses.push(`${tablePrefix}vehicle_id = ANY($${paramIdx})`)
    values.push(filterParams.vehicleIds)
    paramIdx++
  }
  if (filterParams.teamIds && filterParams.teamIds.length > 0) {
    clauses.push(`${tablePrefix}loading_team_id = ANY($${paramIdx})`)
    values.push(filterParams.teamIds)
    paramIdx++
  }
  if (filterParams.delayCategories && filterParams.delayCategories.length > 0) {
    clauses.push(`${tablePrefix}delay_category = ANY($${paramIdx})`)
    values.push(filterParams.delayCategories)
    paramIdx++
  }
  if (filterParams.minDelayMinutes) {
    clauses.push(`${tablePrefix}duration_minutes >= $${paramIdx}`)
    values.push(filterParams.minDelayMinutes)
    paramIdx++
  }
  if (filterParams.spatialBounds) {
    const { minLng, maxLng, minLat, maxLat } = filterParams.spatialBounds
    clauses.push(
      `${tablePrefix}station_id IN (
        SELECT id FROM transfer_stations 
        WHERE ST_Intersects(
          location::geometry,
          ST_MakeEnvelope($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, 4326)
        )
      )`
    )
    values.push(minLng, minLat, maxLng, maxLat)
    paramIdx += 4
  }

  return { clauses, values }
}

export async function getStationAggregatesDb(params: FilterParams): Promise<StationAggregate[]> {
  const sql = getDbClient()
  const { clauses, values: queryParams } = buildWhereClauses(params, 'dr')

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

  const query = `
    SELECT
      ts.id as station_id,
      ts.name as station_name,
      ST_X(ts.location::geometry) as lng,
      ST_Y(ts.location::geometry) as lat,
      COUNT(DISTINCT dr.waybill_id) as total_waybills,
      COUNT(DISTINCT CASE WHEN dr.is_delayed THEN dr.waybill_id END) as delayed_waybills,
      AVG(dr.duration_minutes) as average_duration_minutes,
      COUNT(DISTINCT er.id) as exceptions,
      ARRAY_AGG(DISTINCT wr.condition) FILTER (WHERE wr.condition IS NOT NULL) as weather_conditions
    FROM transfer_stations ts
    LEFT JOIN delay_records dr ON dr.station_id = ts.id
    LEFT JOIN exception_records er ON er.station_id = ts.id AND er.waybill_id = dr.waybill_id
    LEFT JOIN weather_records wr ON wr.station_id = ts.id 
      AND wr.timestamp BETWEEN dr.arrival_time - INTERVAL '1 hour' AND dr.arrival_time + INTERVAL '1 hour'
    ${whereSql}
    GROUP BY ts.id, ts.name, ts.location
    ORDER BY total_waybills DESC
  `

  const results = await sql.unsafe(query, queryParams)

  return results.map((row: any) => ({
    stationId: row.station_id,
    stationName: row.station_name,
    location: { lng: parseFloat(row.lng), lat: parseFloat(row.lat) },
    totalWaybills: parseInt(row.total_waybills) || 0,
    delayedWaybills: parseInt(row.delayed_waybills) || 0,
    averageDurationMinutes: parseFloat(row.average_duration_minutes) || 0,
    delayRate: row.total_waybills > 0 ? (row.delayed_waybills || 0) / row.total_waybills : 0,
    exceptions: parseInt(row.exceptions) || 0,
    weatherConditions: row.weather_conditions || [],
  }))
}

export async function getPathAggregatesDb(params: FilterParams): Promise<PathAggregate[]> {
  const sql = getDbClient()
  const { clauses, values: queryParams } = buildWhereClauses(params, 'dr')
  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

  const query = `
    SELECT
      w.origin_station_id,
      w.dest_station_id,
      os.name as origin_name,
      ds.name as dest_name,
      COUNT(DISTINCT w.id) as waybill_count,
      COUNT(DISTINCT CASE WHEN w.status = 'delayed' THEN w.id END) as delay_count,
      AVG(dr.duration_minutes) as avg_stay_minutes,
      AVG(EXTRACT(EPOCH FROM (w.actual_arrival - w.estimated_arrival))/60) as avg_delay_minutes,
      ST_X(os.location::geometry) as origin_lng,
      ST_Y(os.location::geometry) as origin_lat,
      ST_X(ds.location::geometry) as dest_lng,
      ST_Y(ds.location::geometry) as dest_lat,
      json_agg(DISTINCT dr.delay_category) FILTER (WHERE dr.delay_category IS NOT NULL) as categories
    FROM waybills w
    JOIN transfer_stations os ON os.id = w.origin_station_id
    JOIN transfer_stations ds ON ds.id = w.dest_station_id
    JOIN delay_records dr ON dr.waybill_id = w.id AND dr.station_id = w.origin_station_id
    ${whereSql}
    WHERE w.actual_arrival IS NOT NULL
    GROUP BY w.origin_station_id, w.dest_station_id, os.name, ds.name, os.location, ds.location
  `

  const results = await sql.unsafe(query, queryParams)

  return results.map((row: any) => {
    const midLng = (row.origin_lng + row.dest_lng) / 2
    const midLat = (row.origin_lat + row.dest_lat) / 2 + (Math.random() - 0.5) * 2

    const categoryCounts: Record<string, number> = {}
    ;(row.categories || []).forEach((cat: string) => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })
    const topReasons = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))

    return {
      id: `${row.origin_station_id}_${row.dest_station_id}`,
      originStationId: row.origin_station_id,
      destStationId: row.dest_station_id,
      originName: row.origin_name,
      destName: row.dest_name,
      waybillCount: parseInt(row.waybill_count) || 0,
      delayCount: parseInt(row.delay_count) || 0,
      averageDurationMinutes: parseFloat(row.avg_stay_minutes) || 0,
      averageDelayMinutes: parseFloat(row.avg_delay_minutes) || 0,
      path: [
        { lng: parseFloat(row.origin_lng), lat: parseFloat(row.origin_lat) },
        { lng: midLng, lat: midLat },
        { lng: parseFloat(row.dest_lng), lat: parseFloat(row.dest_lat) },
      ],
      isDelayed: (row.delay_count || 0) > (row.waybill_count || 0) * 0.2,
      topReasons,
    }
  })
}

export async function getExceptionsDb(params: FilterParams): Promise<ExceptionRecord[]> {
  const sql = getDbClient()
  const clauses: string[] = []
  const queryParams: any[] = []
  let paramIdx = 1

  if (params.startDate) {
    clauses.push(`timestamp >= $${paramIdx}`)
    queryParams.push(params.startDate)
    paramIdx++
  }
  if (params.endDate) {
    clauses.push(`timestamp <= $${paramIdx}`)
    queryParams.push(params.endDate + ' 23:59:59')
    paramIdx++
  }
  if (params.stationIds && params.stationIds.length > 0) {
    clauses.push(`station_id = ANY($${paramIdx})`)
    queryParams.push(params.stationIds)
    paramIdx++
  }
  if (params.severityLevels && params.severityLevels.length > 0) {
    clauses.push(`severity = ANY($${paramIdx})`)
    queryParams.push(params.severityLevels)
    paramIdx++
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

  const query = `
    SELECT * FROM exception_records
    ${whereSql}
    ORDER BY timestamp DESC
    LIMIT 500
  `

  const results = await sql.unsafe(query, queryParams)

  return results.map((row: any) => ({
    id: row.id,
    waybillId: row.waybill_id,
    stationId: row.station_id,
    timestamp: row.timestamp,
    type: row.type,
    severity: row.severity,
    description: row.description,
    handlingStatus: row.handling_status,
    handlerId: row.handler_id,
  }))
}

export async function getDelayRecordsDb(params: FilterParams): Promise<DelayRecord[]> {
  const sql = getDbClient()
  const { clauses, values: queryParams } = buildWhereClauses(params, '')
  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

  const query = `
    SELECT * FROM delay_records
    ${whereSql}
    ORDER BY arrival_time DESC
    LIMIT 1000
  `

  const results = await sql.unsafe(query, queryParams)

  return results.map((row: any) => ({
    id: row.id,
    waybillId: row.waybill_id,
    stationId: row.station_id,
    vehicleId: row.vehicle_id,
    arrivalScanId: row.arrival_scan_id,
    departureScanId: row.departure_scan_id,
    arrivalTime: row.arrival_time,
    departureTime: row.departure_time,
    businessDay: row.business_day,
    durationMinutes: row.duration_minutes,
    isOvernight: row.is_overnight,
    isDelayed: row.is_delayed,
    delayCategory: row.delay_category,
    loadingTeamId: row.loading_team_id,
    attributedToTeam: row.attributed_to_team,
  }))
}

export async function getScanSequenceDb(waybillId: string): Promise<ScanSequenceItem[]> {
  const sql = getDbClient()

  const query = `
    SELECT
      sr.*,
      ts.name as station_name,
      ST_X(ts.location::geometry) as station_lng,
      ST_Y(ts.location::geometry) as station_lat,
      ts.province,
      ts.city,
      wr.condition as weather_condition,
      wr.temperature,
      wr.visibility,
      wr.wind_speed
    FROM scan_records sr
    JOIN transfer_stations ts ON ts.id = sr.station_id
    LEFT JOIN weather_records wr ON wr.station_id = sr.station_id
      AND wr.timestamp BETWEEN sr.timestamp - INTERVAL '2 hours' AND sr.timestamp + INTERVAL '2 hours'
    WHERE sr.waybill_id = $1
    ORDER BY sr.timestamp ASC
  `

  const results = await sql.unsafe(query, [waybillId])

  return results.map((row: any, idx: number, arr: any[]) => {
    let durationToNext: number | undefined
    if (idx < arr.length - 1) {
      const next = arr[idx + 1]
      durationToNext = Math.round(
        (new Date(next.timestamp).getTime() - new Date(row.timestamp).getTime()) / (1000 * 60)
      )
    }

    return {
      scan: {
        id: row.id,
        waybillId: row.waybill_id,
        vehicleId: row.vehicle_id,
        stationId: row.station_id,
        scanType: row.scan_type,
        timestamp: row.timestamp,
        operatorId: row.operator_id,
        location: { lng: parseFloat(row.station_lng), lat: parseFloat(row.station_lat) },
      },
      station: {
        id: row.station_id,
        name: row.station_name,
        code: '',
        location: { lng: parseFloat(row.station_lng), lat: parseFloat(row.station_lat) },
        province: row.province,
        city: row.city,
        level: 'regional',
      },
      weather: row.weather_condition ? {
        id: '',
        stationId: row.station_id,
        timestamp: row.timestamp,
        condition: row.weather_condition,
        temperature: parseFloat(row.temperature),
        windSpeed: parseFloat(row.wind_speed),
        visibility: parseFloat(row.visibility),
      } : undefined,
      durationToNext,
    }
  })
}

export async function getLoadingTeamPerformanceDb(params: FilterParams) {
  const sql = getDbClient()
  const { clauses, values: queryParams } = buildWhereClauses(params, 'dr')
  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

  const query = `
    SELECT
      lt.id as team_id,
      lt.name as team_name,
      lt.station_id,
      ts.name as station_name,
      COUNT(DISTINCT dr.waybill_id) as total_waybills,
      COUNT(DISTINCT CASE WHEN dr.is_delayed THEN dr.waybill_id END) as delayed_waybills,
      AVG(dr.duration_minutes) as average_duration_minutes
    FROM loading_teams lt
    JOIN transfer_stations ts ON ts.id = lt.station_id
    LEFT JOIN delay_records dr ON dr.loading_team_id = lt.id AND dr.attributed_to_team = true
    ${whereSql}
    GROUP BY lt.id, lt.name, lt.station_id, ts.name
    HAVING COUNT(DISTINCT dr.waybill_id) > 0
    ORDER BY total_waybills DESC
  `

  const results = await sql.unsafe(query, queryParams)

  return results.map((row: any) => {
    const total = parseInt(row.total_waybills) || 0
    const delayed = parseInt(row.delayed_waybills) || 0
    return {
      teamId: row.team_id,
      teamName: row.team_name,
      stationId: row.station_id,
      stationName: row.station_name,
      totalWaybills: total,
      delayedWaybills: delayed,
      delayRate: total > 0 ? delayed / total : 0,
      averageDurationMinutes: parseFloat(row.average_duration_minutes) || 0,
      isLowSample: isLowSample(total),
    }
  })
}

export async function getStationsDb() {
  const sql = getDbClient()
  const query = `
    SELECT 
      id, name, code, province, city, level,
      ST_X(location::geometry) as lng,
      ST_Y(location::geometry) as lat
    FROM transfer_stations
    ORDER BY name
  `
  const results = await sql.unsafe(query)
  return results.map((row: any) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    location: { lng: parseFloat(row.lng), lat: parseFloat(row.lat) },
    province: row.province,
    city: row.city,
    level: row.level,
  }))
}

export async function getVehiclesDb() {
  const sql = getDbClient()
  const results = await sql`SELECT * FROM vehicles ORDER BY plate_number`
  return results.map((row: any) => ({
    id: row.id,
    plateNumber: row.plate_number,
    type: row.type,
    capacity: row.capacity,
    status: row.status,
    teamId: row.team_id,
  }))
}

export async function getLoadingTeamsDb() {
  const sql = getDbClient()
  const results = await sql`SELECT * FROM loading_teams ORDER BY name`
  return results.map((row: any) => ({
    id: row.id,
    name: row.name,
    stationId: row.station_id,
    shift: row.shift,
    size: row.size,
  }))
}
