import type {
  MonitorStation,
  AirQualityReading,
  AggregateResult,
  ComplaintAggregate,
  ConstructionSite,
  TrafficData,
  SystemStatus,
  LinkedFilterOptions
} from '@/types'

const API_BASE = '/api'

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options)
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  return fetchJson<SystemStatus>('/status')
}

export async function fetchStations(district?: string): Promise<MonitorStation[]> {
  const params = new URLSearchParams()
  if (district) params.set('district', district)
  return fetchJson<MonitorStation[]>(`/stations${params.toString() ? '?' + params : ''}`)
}

export async function fetchLinkedFilters(districts: string[], stations: string[]): Promise<LinkedFilterOptions> {
  const params = new URLSearchParams()
  if (districts.length) params.set('districts', JSON.stringify(districts))
  if (stations.length) params.set('stations', JSON.stringify(stations))
  return fetchJson<LinkedFilterOptions>(`/filters/linked${params.toString() ? '?' + params : ''}`)
}

export async function fetchAirQualityAggregate(query: {
  dimensions: string[]
  metrics: string[]
  filters: {
    timeRange?: { start: string; end: string }
    districts?: string[]
    stations?: string[]
    pollutants?: string[]
  }
}): Promise<AggregateResult[]> {
  const params = new URLSearchParams()
  params.set('dimensions', JSON.stringify(query.dimensions))
  params.set('metrics', JSON.stringify(query.metrics))
  if (query.filters.timeRange) {
    params.set('start', query.filters.timeRange.start)
    params.set('end', query.filters.timeRange.end)
  }
  if (query.filters.districts?.length) {
    params.set('districts', JSON.stringify(query.filters.districts))
  }
  if (query.filters.stations?.length) {
    params.set('stations', JSON.stringify(query.filters.stations))
  }
  if (query.filters.pollutants?.length) {
    params.set('pollutants', JSON.stringify(query.filters.pollutants))
  }
  return fetchJson<AggregateResult[]>(`/air-quality/aggregate?${params}`)
}

export async function fetchTimeSeries(
  stationIds: string[],
  start: string,
  end: string
): Promise<AirQualityReading[]> {
  const params = new URLSearchParams()
  params.set('stations', JSON.stringify(stationIds))
  params.set('start', start)
  params.set('end', end)
  return fetchJson<AirQualityReading[]>(`/air-quality/timeseries?${params}`)
}

export async function fetchHeatmap(date: string): Promise<Array<{
  district: string
  avgAqi: number
  avgPm25: number
  stationCount: number
}>> {
  return fetchJson<Array<{
    district: string
    avgAqi: number
    avgPm25: number
    stationCount: number
  }>>(`/air-quality/heatmap?date=${date}`)
}

export async function fetchComplaintsAggregate(
  district?: string,
  start?: string,
  end?: string
): Promise<ComplaintAggregate[]> {
  const params = new URLSearchParams()
  if (district) params.set('district', district)
  if (start) params.set('start', start)
  if (end) params.set('end', end)
  return fetchJson<ComplaintAggregate[]>(`/complaints/aggregate${params.toString() ? '?' + params : ''}`)
}

export async function fetchConstructionSites(
  district?: string,
  status?: 'active' | 'completed'
): Promise<ConstructionSite[]> {
  const params = new URLSearchParams()
  if (district) params.set('district', district)
  if (status) params.set('status', status)
  return fetchJson<ConstructionSite[]>(`/construction${params.toString() ? '?' + params : ''}`)
}

export async function fetchTrafficData(
  districts: string[],
  hours: number = 24
): Promise<TrafficData[]> {
  const params = new URLSearchParams()
  params.set('districts', JSON.stringify(districts))
  params.set('hours', String(hours))
  return fetchJson<TrafficData[]>(`/traffic?${params}`)
}

export async function exportData(
  criteria: {
    stations: string[]
    timeRange: { start: string; end: string }
    pollutants: string[]
  },
  format: 'csv' | 'json' = 'csv'
): Promise<{ content: string; filename: string; blob: Blob }> {
  const res = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ criteria, format }),
  })
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const content = await blob.text()
  const filename = `air-quality-${Date.now()}.${format}`
  return { content, filename, blob }
}
