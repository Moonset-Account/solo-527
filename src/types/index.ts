export interface MonitorStation {
  id: string
  name: string
  district: string
  lat: number
  lng: number
  status: 'online' | 'offline' | 'warning'
  lastUpdate: string
}

export interface AirQualityReading {
  stationId: string
  timestamp: string
  pm25: number
  pm10: number
  ozone: number
  no2: number
  so2: number
  co: number
  aqi: number
  windDirection: number
  windSpeed: number
  temperature: number
  humidity: number
}

export interface TrafficData {
  district: string
  timestamp: string
  vehicleCount: number
  avgSpeed: number
}

export interface ConstructionSite {
  id: string
  name: string
  district: string
  lat: number
  lng: number
  startDate: string
  endDate: string
  status: 'active' | 'completed'
}

export interface ComplaintAggregate {
  district: string
  date: string
  totalCount: number
  odorCount: number
  dustCount: number
  noiseCount: number
  otherCount: number
}

export interface FilterCriteria {
  stations: string[]
  pollutants: string[]
  timeRange: { start: string; end: string }
  districts: string[]
  eventTypes: string[]
}

export interface SystemStatus {
  lastUpdate: string
  onlineStations: number
  totalStations: number
  dataLatency: number
}

export interface DistrictHeatmap {
  district: string
  avgAqi: number
  avgPm25: number
  stationCount: number
}

export type PollutantType = 'pm25' | 'pm10' | 'ozone' | 'no2' | 'so2' | 'co' | 'aqi'

export const POLLUTANT_CONFIG: Record<PollutantType, { name: string; unit: string; color: string }> = {
  pm25: { name: 'PM2.5', unit: 'μg/m³', color: '#ef4444' },
  pm10: { name: 'PM10', unit: 'μg/m³', color: '#f97316' },
  ozone: { name: '臭氧', unit: 'μg/m³', color: '#22c55e' },
  no2: { name: 'NO₂', unit: 'μg/m³', color: '#3b82f6' },
  so2: { name: 'SO₂', unit: 'μg/m³', color: '#8b5cf6' },
  co: { name: 'CO', unit: 'mg/m³', color: '#ec4899' },
  aqi: { name: 'AQI', unit: '', color: '#0f766e' },
}

export const DISTRICTS = [
  '东城区', '西城区', '朝阳区', '海淀区', '丰台区',
  '石景山区', '通州区', '顺义区', '大兴区', '昌平区'
]
