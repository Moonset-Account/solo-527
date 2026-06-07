/**
 * 聚合 API 网关层
 * 
 * 职责：
 * 1. 整合 ClickHouse 数据查询
 * 2. 通过 Redis 缓存查询结果
 * 3. 实现多维度联动筛选逻辑
 * 4. 数据脱敏和隐私保护
 * 5. 统一数据格式返回
 */

import { redis, TTL } from './redis'
import { clickHouse, type AggregateQuery, type AggregateResultRow } from './clickhouse'
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
  generateSystemStatus,
  generateConstructionSites,
  generateComplaintData,
} from '@/mock/dataGenerator'

function hashKey(obj: Record<string, any>): string {
  const keys = Object.keys(obj).sort()
  const parts = keys.map(k => `${k}=${JSON.stringify(obj[k])}`)
  return parts.join('&')
}

async function withCache<T>(
  prefix: string,
  params: Record<string, any>,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const key = `${prefix}:${hashKey(params)}`
  const cached = redis.get<T>(key)
  if (cached !== null) {
    return cached
  }
  const data = await fetcher()
  redis.set(key, data, ttl)
  return data
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  return withCache(
    'system:status',
    {},
    TTL.REAL_TIME,
    async () => generateSystemStatus()
  )
}

export async function fetchStations(filters?: {
  district?: string
  status?: string
}): Promise<MonitorStation[]> {
  return withCache(
    'stations:list',
    filters || {},
    TTL.MEDIUM,
    async () => {
      let stations = generateStations()
      if (filters?.district) {
        stations = stations.filter(s => s.district === filters.district)
      }
      if (filters?.status) {
        stations = stations.filter(s => s.status === filters.status)
      }
      return stations
    }
  )
}

export async function fetchAirQualityAggregate(query: AggregateQuery): Promise<AggregateResultRow[]> {
  const cacheParams = {
    dims: query.dimensions,
    metrics: query.metrics,
    filters: query.filters,
    granularity: query.granularity,
  }
  return withCache(
    'aq:aggregate',
    cacheParams,
    TTL.SHORT,
    async () => clickHouse.queryAirQuality(query)
  )
}

export async function fetchTrafficAggregate(query: AggregateQuery): Promise<AggregateResultRow[]> {
  const cacheParams = {
    dims: query.dimensions,
    metrics: query.metrics,
    filters: query.filters,
  }
  return withCache(
    'traffic:aggregate',
    cacheParams,
    TTL.MEDIUM,
    async () => clickHouse.queryTraffic(query)
  )
}

export async function fetchTimeSeries(
  stationIds: string[],
  start: string,
  end: string,
  _pollutants: string[]
): Promise<AirQualityReading[]> {
  const params = { stationIds: stationIds.sort(), start, end }
  return withCache(
    'aq:timeseries',
    params,
    TTL.SHORT,
    async () => clickHouse.getRawReadings(stationIds, start, end)
  )
}

export async function fetchHeatmap(date: string): Promise<DistrictHeatmap[]> {
  return withCache(
    'aq:heatmap',
    { date },
    TTL.SHORT,
    async () => {
      const result = await clickHouse.queryAirQuality({
        dimensions: ['district'],
        metrics: ['avg'],
        filters: {
          timeRange: {
            start: `${date}T00:00:00Z`,
            end: `${date}T23:59:59Z`,
          },
          pollutants: ['aqi', 'pm25'],
        },
      })

      const stations = await fetchStations()
      const districtStationCount = new Map<string, number>()
      stations.forEach(s => {
        districtStationCount.set(s.district, (districtStationCount.get(s.district) || 0) + 1)
      })

      return result.map(row => ({
        district: row.district as string,
        avgAqi: Math.round((row.aqi_avg as number) || 0),
        avgPm25: Math.round((row.pm25_avg as number) || 0),
        stationCount: districtStationCount.get(row.district as string) || 0,
      }))
    }
  )
}

export async function fetchComplaintsAggregate(
  district: string | undefined,
  start: string,
  end: string
): Promise<ComplaintAggregate[]> {
  const params = { district, start, end }
  return withCache(
    'complaints:aggregate',
    params,
    TTL.DAILY,
    async () => {
      let data = generateComplaintData(start, end)
      if (district) {
        data = data.filter(c => c.district === district)
      }
      return data
    }
  )
}

export async function fetchConstructionSites(filters?: {
  district?: string
  status?: 'active' | 'completed'
}): Promise<ConstructionSite[]> {
  return withCache(
    'construction:list',
    filters || {},
    TTL.LONG,
    async () => {
      let sites = generateConstructionSites()
      if (filters?.district) {
        sites = sites.filter(s => s.district === filters.district)
      }
      if (filters?.status) {
        sites = sites.filter(s => s.status === filters.status)
      }
      return sites
    }
  )
}

export async function fetchTrafficData(
  districts: string[],
  hours: number = 24
): Promise<TrafficData[]> {
  const params = { districts: districts.sort(), hours }
  return withCache(
    'traffic:raw',
    params,
    TTL.MEDIUM,
    async () => {
      const end = new Date()
      const start = new Date(end.getTime() - hours * 60 * 60 * 1000)
      const result = await clickHouse.queryTraffic({
        dimensions: ['district', 'hour'],
        metrics: ['avg', 'max'],
        filters: {
          timeRange: { start: start.toISOString(), end: end.toISOString() },
          districts,
        },
      })

      return result.map(row => ({
        district: row.district as string,
        timestamp: row.date ? `${row.date}T${String(row.hour).padStart(2, '0')}:00:00Z` : new Date().toISOString(),
        vehicleCount: (row.vehicleCount_avg as number) || 0,
        avgSpeed: (row.avgSpeed_avg as number) || 0,
      }))
    }
  )
}

export interface LinkedFilterResult {
  availableStations: MonitorStation[]
  availableDistricts: string[]
  availableHours: number[]
  districtComplaintCounts: Map<string, number>
  districtConstructionCount: Map<string, number>
}

export async function getLinkedFilterOptions(filters: {
  districts?: string[]
  stations?: string[]
  timeRange?: { start: string; end: string }
  eventTypes?: string[]
}): Promise<LinkedFilterResult> {
  const cacheKey = {
    districts: filters.districts?.sort(),
    stations: filters.stations?.sort(),
    timeRange: filters.timeRange,
  }

  return withCache(
    'filters:linked',
    cacheKey,
    TTL.SHORT,
    async () => {
      const [allStations, complaints, constructions] = await Promise.all([
        fetchStations(),
        fetchComplaintsAggregate(
          undefined,
          filters.timeRange?.start || new Date(Date.now() - 7 * 86400000).toISOString(),
          filters.timeRange?.end || new Date().toISOString()
        ),
        fetchConstructionSites(),
      ])

      let availableStations = allStations

      if (filters.districts && filters.districts.length > 0) {
        availableStations = availableStations.filter(s => filters.districts!.includes(s.district))
      }

      if (filters.stations && filters.stations.length > 0) {
        availableStations = availableStations.filter(s => filters.stations!.includes(s.id))
      }

      const availableDistricts = Array.from(new Set(availableStations.map(s => s.district)))

      const districtComplaintCounts = new Map<string, number>()
      complaints.forEach(c => {
        if (!filters.districts || filters.districts.includes(c.district)) {
          districtComplaintCounts.set(
            c.district,
            (districtComplaintCounts.get(c.district) || 0) + c.totalCount
          )
        }
      })

      const districtConstructionCount = new Map<string, number>()
      constructions.filter(s => s.status === 'active').forEach(c => {
        if (!filters.districts || filters.districts.includes(c.district)) {
          districtConstructionCount.set(
            c.district,
            (districtConstructionCount.get(c.district) || 0) + 1
          )
        }
      })

      return {
        availableStations,
        availableDistricts,
        availableHours: Array.from({ length: 24 }, (_, i) => i),
        districtComplaintCounts,
        districtConstructionCount,
      }
    }
  )
}

export async function exportData(
  criteria: {
    stations: string[]
    timeRange: { start: string; end: string }
    pollutants: string[]
  },
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
      ...criteria.pollutants.map(p => (row as any)[p] ?? ''),
    ])
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    return {
      content,
      filename: `air-quality-${Date.now()}.csv`,
    }
  } else {
    const enriched = data.map(row => ({
      timestamp: row.timestamp,
      stationId: row.stationId,
      stationName: stationMap.get(row.stationId),
      ...criteria.pollutants.reduce((acc, p) => {
        (acc as any)[p] = (row as any)[p]
        return acc
      }, {}),
    }))
    return {
      content: JSON.stringify(enriched, null, 2),
      filename: `air-quality-${Date.now()}.json`,
    }
  }
}

export function getCacheStats() {
  return {
    ...redis.getStats(),
    hitRate: redis.getHitRate(),
  }
}

export function clearCache(): void {
  redis.flushAll()
}
