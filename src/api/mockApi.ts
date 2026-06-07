import type {
  MonitorStation,
  AirQualityReading,
  ConstructionSite,
  ComplaintAggregate,
  SystemStatus,
  DistrictHeatmap,
  TrafficData,
} from '@/types'
import {
  generateStations,
  generateTimeSeriesData,
  generateSystemStatus,
  generateHeatmapData,
  generateConstructionSites,
  generateComplaintData,
  generateTrafficData,
} from './dataGenerator'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MockCache {
  private cache = new Map<string, CacheEntry<any>>()

  private getKey(prefix: string, params: Record<string, any>): string {
    return `${prefix}:${JSON.stringify(params)}`
  }

  get<T>(prefix: string, params: Record<string, any>): T | null {
    const key = this.getKey(prefix, params)
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  set<T>(prefix: string, params: Record<string, any>, data: T, ttlMs: number): void {
    const key = this.getKey(prefix, params)
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
  }

  clear(): void {
    this.cache.clear()
  }
}

const cache = new MockCache()

const TTL = {
  STATUS: 30 * 1000,
  STATIONS: 60 * 60 * 1000,
  TIMESERIES: 5 * 60 * 1000,
  HEATMAP: 10 * 60 * 1000,
  COMPLAINTS: 24 * 60 * 60 * 1000,
  CONSTRUCTION: 60 * 60 * 1000,
  TRAFFIC: 30 * 60 * 1000,
}

function delay<T>(data: T, ms: number = 200): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const cached = cache.get<SystemStatus>('status', {})
  if (cached) return delay(cached, 50)

  const data = generateSystemStatus()
  cache.set('status', {}, data, TTL.STATUS)
  return delay(data)
}

export async function fetchStations(district?: string): Promise<MonitorStation[]> {
  const cached = cache.get<MonitorStation[]>('stations', { district })
  if (cached) return delay(cached, 50)

  let data = generateStations()
  if (district) {
    data = data.filter(s => s.district === district)
  }
  cache.set('stations', { district }, data, TTL.STATIONS)
  return delay(data)
}

export async function fetchTimeSeries(
  stationIds: string[],
  start: string,
  end: string,
  _pollutants: string[]
): Promise<AirQualityReading[]> {
  const cached = cache.get<AirQualityReading[]>('timeseries', { stationIds, start, end })
  if (cached) return delay(cached, 80)

  const data = generateTimeSeriesData(stationIds, new Date(start), new Date(end))
  cache.set('timeseries', { stationIds, start, end }, data, TTL.TIMESERIES)
  return delay(data)
}

export async function fetchHeatmap(date: string): Promise<DistrictHeatmap[]> {
  const cached = cache.get<DistrictHeatmap[]>('heatmap', { date })
  if (cached) return delay(cached, 60)

  const data = generateHeatmapData()
  cache.set('heatmap', { date }, data, TTL.HEATMAP)
  return delay(data)
}

export async function fetchComplaints(
  district: string | undefined,
  start: string,
  end: string
): Promise<ComplaintAggregate[]> {
  const cached = cache.get<ComplaintAggregate[]>('complaints', { district, start, end })
  if (cached) return delay(cached, 50)

  let data = generateComplaintData(start, end)
  if (district) {
    data = data.filter(c => c.district === district)
  }
  cache.set('complaints', { district, start, end }, data, TTL.COMPLAINTS)
  return delay(data)
}

export async function fetchConstructionSites(): Promise<ConstructionSite[]> {
  const cached = cache.get<ConstructionSite[]>('construction', {})
  if (cached) return delay(cached, 50)

  const data = generateConstructionSites()
  cache.set('construction', {}, data, TTL.CONSTRUCTION)
  return delay(data)
}

export async function fetchTrafficData(districts: string[], hours: number = 24): Promise<TrafficData[]> {
  const cached = cache.get<TrafficData[]>('traffic', { districts, hours })
  if (cached) return delay(cached, 50)

  const data = generateTrafficData(districts, hours)
  cache.set('traffic', { districts, hours }, data, TTL.TRAFFIC)
  return delay(data)
}

export async function exportData(
  criteria: { stations: string[]; timeRange: { start: string; end: string }; pollutants: string[] },
  format: 'csv' | 'json'
): Promise<{ content: string; filename: string }> {
  const data = await fetchTimeSeries(
    criteria.stations,
    criteria.timeRange.start,
    criteria.timeRange.end,
    criteria.pollutants
  )

  const stations = await fetchStations()
  const stationMap = new Map(stations.map(s => [s.id, s.name]))

  if (format === 'csv') {
    const headers = ['timestamp', 'station', 'station_id', ...criteria.pollutants]
    const rows = data.map(row => [
      row.timestamp,
      stationMap.get(row.stationId) || row.stationId,
      row.stationId,
      ...criteria.pollutants.map(p => (row as any)[p]),
    ])
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    return {
      content,
      filename: `air-quality-${Date.now()}.csv`,
    }
  } else {
    const enriched = data.map(row => ({
      ...row,
      stationName: stationMap.get(row.stationId),
    }))
    return {
      content: JSON.stringify(enriched, null, 2),
      filename: `air-quality-${Date.now()}.json`,
    }
  }
}

export function clearCache(): void {
  cache.clear()
}
