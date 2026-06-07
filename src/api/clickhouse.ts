/**
 * 模拟 ClickHouse 聚合查询引擎
 * 
 * 实现以下聚合能力：
 * 1. 按街区 (district) 聚合
 * 2. 按小时 (hour) 时间粒度聚合
 * 3. 按污染物指标聚合统计
 * 4. 多维度组合 GROUP BY
 * 5. 时间范围筛选
 */

import type { AirQualityReading, MonitorStation, TrafficData } from '@/types'
import { generateTimeSeriesData, generateTrafficData, generateStations } from '@/mock/dataGenerator'

export interface AggregateQuery {
  dimensions: ('station' | 'district' | 'hour' | 'date' | 'pollutant')[]
  metrics: ('avg' | 'max' | 'min' | 'count' | 'sum')[]
  filters: {
    timeRange?: { start: string; end: string }
    districts?: string[]
    stations?: string[]
    pollutants?: string[]
  }
  granularity?: '5min' | '15min' | '1hour' | '1day'
}

export interface AggregateResultRow {
  [key: string]: string | number | null
}

interface ClickHouseTable {
  name: string
  columns: string[]
  data: any[]
}

class MockClickHouse {
  private tables: Map<string, ClickHouseTable> = new Map()
  private stationMap: Map<string, MonitorStation> = new Map()

  constructor() {
    this.initializeTables()
  }

  private initializeTables() {
    const stations = generateStations()
    stations.forEach(s => this.stationMap.set(s.id, s))

    const allStations = stations.map(s => s.id)
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    const airQualityData = generateTimeSeriesData(allStations, startDate, endDate)
    const airQualityWithDistrict = airQualityData.map(row => ({
      ...row,
      district: this.stationMap.get(row.stationId)?.district || 'unknown',
      hour: new Date(row.timestamp).getHours(),
      date: new Date(row.timestamp).toISOString().split('T')[0],
    }))

    this.tables.set('air_quality', {
      name: 'air_quality',
      columns: ['stationId', 'district', 'timestamp', 'date', 'hour', 'pm25', 'pm10', 'ozone', 'no2', 'so2', 'co', 'aqi'],
      data: airQualityWithDistrict,
    })

    const districts = Array.from(new Set(stations.map(s => s.district)))
    const trafficData = generateTrafficData(districts, 24 * 7)
    this.tables.set('traffic', {
      name: 'traffic',
      columns: ['district', 'timestamp', 'hour', 'vehicleCount', 'avgSpeed'],
      data: trafficData.map(row => ({
        ...row,
        hour: new Date(row.timestamp).getHours(),
        date: new Date(row.timestamp).toISOString().split('T')[0],
      })),
    })
  }

  async queryAirQuality(query: AggregateQuery): Promise<AggregateResultRow[]> {
    await this.simulateLatency(50, 150)

    const table = this.tables.get('air_quality')
    if (!table) return []

    let data = [...table.data]

    if (query.filters.timeRange) {
      const start = new Date(query.filters.timeRange.start).getTime()
      const end = new Date(query.filters.timeRange.end).getTime()
      data = data.filter(row => {
        const ts = new Date(row.timestamp).getTime()
        return ts >= start && ts <= end
      })
    }

    if (query.filters.districts && query.filters.districts.length > 0) {
      data = data.filter(row => query.filters.districts!.includes(row.district))
    }

    if (query.filters.stations && query.filters.stations.length > 0) {
      data = data.filter(row => query.filters.stations!.includes(row.stationId))
    }

    const pollutants = query.filters.pollutants || ['pm25', 'pm10', 'ozone', 'no2', 'aqi']

    const groupKeys = query.dimensions
    const grouped = new Map<string, any[]>()

    for (const row of data) {
      const key = groupKeys.map(k => {
        if (k === 'station') return row.stationId
        if (k === 'district') return row.district
        if (k === 'hour') return String(row.hour).padStart(2, '0')
        if (k === 'date') return row.date
        return String(row[k as keyof typeof row] || '')
      }).join('|||')

      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(row)
    }

    const results: AggregateResultRow[] = []

    for (const [key, rows] of grouped) {
      const keyParts = key.split('|||')
      const row: AggregateResultRow = {}

      groupKeys.forEach((k, idx) => {
        if (k === 'station') {
          row.station_id = keyParts[idx]
          row.station_name = this.stationMap.get(keyParts[idx])?.name || keyParts[idx]
        } else if (k === 'district') {
          row.district = keyParts[idx]
        } else if (k === 'hour') {
          row.hour = parseInt(keyParts[idx])
          row.hour_label = `${keyParts[idx]}:00`
        } else if (k === 'date') {
          row.date = keyParts[idx]
        }
      })

      for (const pollutant of pollutants) {
        const values = rows.map(r => r[pollutant]).filter(v => v != null && !isNaN(v))
        if (values.length === 0) continue

        if (query.metrics.includes('avg')) {
          row[`${pollutant}_avg`] = parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
        }
        if (query.metrics.includes('max')) {
          row[`${pollutant}_max`] = Math.max(...values)
        }
        if (query.metrics.includes('min')) {
          row[`${pollutant}_min`] = Math.min(...values)
        }
        if (query.metrics.includes('count')) {
          row[`${pollutant}_count`] = values.length
        }
      }

      row.sample_count = rows.length
      results.push(row)
    }

    if (query.dimensions.includes('hour')) {
      results.sort((a, b) => (a.hour as number) - (b.hour as number))
    } else if (query.dimensions.includes('date')) {
      results.sort((a, b) => String(a.date).localeCompare(String(b.date)))
    }

    return results
  }

  async queryTraffic(query: AggregateQuery): Promise<AggregateResultRow[]> {
    await this.simulateLatency(30, 100)

    const table = this.tables.get('traffic')
    if (!table) return []

    let data = [...table.data]

    if (query.filters.timeRange) {
      const start = new Date(query.filters.timeRange.start).getTime()
      const end = new Date(query.filters.timeRange.end).getTime()
      data = data.filter(row => {
        const ts = new Date(row.timestamp).getTime()
        return ts >= start && ts <= end
      })
    }

    if (query.filters.districts && query.filters.districts.length > 0) {
      data = data.filter(row => query.filters.districts!.includes(row.district))
    }

    const groupKeys = query.dimensions.filter(d => d !== 'station' && d !== 'pollutant')
    const grouped = new Map<string, any[]>()

    for (const row of data) {
      const key = groupKeys.map(k => {
        if (k === 'district') return row.district
        if (k === 'hour') return String(row.hour).padStart(2, '0')
        if (k === 'date') return row.date
        return String(row[k as keyof typeof row] || '')
      }).join('|||')

      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(row)
    }

    const results: AggregateResultRow[] = []

    for (const [key, rows] of grouped) {
      const keyParts = key.split('|||')
      const row: AggregateResultRow = {}

      groupKeys.forEach((k, idx) => {
        if (k === 'district') row.district = keyParts[idx]
        if (k === 'hour') {
          row.hour = parseInt(keyParts[idx])
          row.hour_label = `${keyParts[idx]}:00`
        }
        if (k === 'date') row.date = keyParts[idx]
      })

      const vehicleCounts = rows.map(r => r.vehicleCount).filter(v => !isNaN(v))
      const speeds = rows.map(r => r.avgSpeed).filter(v => !isNaN(v))

      if (query.metrics.includes('avg')) {
        if (vehicleCounts.length > 0) {
          row.vehicleCount_avg = Math.round(vehicleCounts.reduce((a, b) => a + b, 0) / vehicleCounts.length)
        }
        if (speeds.length > 0) {
          row.avgSpeed_avg = parseFloat((speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1))
        }
      }
      if (query.metrics.includes('sum')) {
        row.vehicleCount_sum = vehicleCounts.reduce((a, b) => a + b, 0)
      }
      if (query.metrics.includes('max')) {
        row.vehicleCount_max = Math.max(...vehicleCounts, 0)
      }

      row.sample_count = rows.length
      results.push(row)
    }

    return results
  }

  async getRawReadings(
    stationIds: string[],
    start: string,
    end: string
  ): Promise<AirQualityReading[]> {
    await this.simulateLatency(80, 200)

    const table = this.tables.get('air_quality')
    if (!table) return []

    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()

    return table.data.filter(row => {
      const ts = new Date(row.timestamp).getTime()
      return (
        ts >= startTime &&
        ts <= endTime &&
        stationIds.includes(row.stationId)
      )
    }).map(row => ({
      stationId: row.stationId,
      timestamp: row.timestamp,
      pm25: row.pm25,
      pm10: row.pm10,
      ozone: row.ozone,
      no2: row.no2,
      so2: row.so2,
      co: row.co,
      aqi: row.aqi,
      windDirection: row.windDirection || 0,
      windSpeed: row.windSpeed || 0,
      temperature: row.temperature || 0,
      humidity: row.humidity || 0,
    }))
  }

  explain(query: AggregateQuery): string {
    return `-- Simulated ClickHouse EXPLAIN
SELECT ${query.dimensions.join(', ')}, ${query.metrics.map(m => m + '(...)').join(', ')}
FROM air_quality
WHERE timestamp BETWEEN '${query.filters.timeRange?.start || '...'}' AND '${query.filters.timeRange?.end || '...'}'
GROUP BY ${query.dimensions.join(', ')}
FORMAT JSON`
  }

  private simulateLatency(minMs: number, maxMs: number): Promise<void> {
    const latency = Math.random() * (maxMs - minMs) + minMs
    return new Promise(resolve => setTimeout(resolve, latency))
  }

  refresh(): void {
    this.initializeTables()
  }
}

export const clickHouse = new MockClickHouse()

export default clickHouse
