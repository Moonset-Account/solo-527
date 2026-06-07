import type {
  MonitorStation,
  AirQualityReading,
  ConstructionSite,
  ComplaintAggregate,
  SystemStatus,
  DistrictHeatmap,
  TrafficData,
} from '@/types'
import { DISTRICTS } from '@/types'

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1))
}

function generateStationId(index: number): string {
  return `ST${String(index + 1).padStart(3, '0')}`
}

const STATION_NAMES = [
  '奥体中心', '前门', '万寿西宫', '官园', '天坛',
  '农展馆', '万柳', '北部新区', '植物园', '顺义新城',
  '昌平镇', '南三环', '亦庄', '通州', '大兴黄村',
  '房山', '门头沟', '平谷', '怀柔', '密云',
  '延庆', '定陵', '八达岭', '密云水库', '东四',
]

export function generateStations(): MonitorStation[] {
  const stations: MonitorStation[] = []
  for (let i = 0; i < 20; i++) {
    const district = DISTRICTS[i % DISTRICTS.length]
    const baseLat = 39.9 + (i - 10) * 0.05
    const baseLng = 116.4 + (i - 10) * 0.06
    stations.push({
      id: generateStationId(i),
      name: STATION_NAMES[i % STATION_NAMES.length],
      district,
      lat: baseLat + randomBetween(-0.02, 0.02),
      lng: baseLng + randomBetween(-0.02, 0.02),
      status: i === 3 || i === 15 ? 'offline' : i === 7 ? 'warning' : 'online',
      lastUpdate: new Date(Date.now() - randomBetween(0, 15 * 60 * 1000)).toISOString(),
    })
  }
  return stations
}

export function generateTimeSeriesData(
  stationIds: string[],
  startDate: Date,
  endDate: Date
): AirQualityReading[] {
  const data: AirQualityReading[] = []
  const intervalMs = 5 * 60 * 1000

  for (const stationId of stationIds) {
    let currentTime = new Date(startDate)
    while (currentTime <= endDate) {
      const hour = currentTime.getHours()
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
      const baseMultiplier = isRushHour ? 1.5 : 1

      data.push({
        stationId,
        timestamp: currentTime.toISOString(),
        pm25: Math.round(randomBetween(10, 80) * baseMultiplier),
        pm10: Math.round(randomBetween(20, 150) * baseMultiplier),
        ozone: Math.round(randomBetween(30, 180) * (1 + Math.sin((hour - 12) * Math.PI / 12) * 0.3)),
        no2: Math.round(randomBetween(10, 80) * baseMultiplier),
        so2: Math.round(randomBetween(2, 30)),
        co: parseFloat((randomBetween(0.3, 2.0) * baseMultiplier).toFixed(1)),
        aqi: Math.round(randomBetween(30, 150) * baseMultiplier),
        windDirection: randomInt(0, 360),
        windSpeed: parseFloat(randomBetween(0.5, 5.0).toFixed(1)),
        temperature: parseFloat(randomBetween(10, 30).toFixed(1)),
        humidity: randomInt(20, 90),
      })
      currentTime = new Date(currentTime.getTime() + intervalMs)
    }
  }
  return data
}

export function generateSystemStatus(): SystemStatus {
  const stations = generateStations()
  const onlineCount = stations.filter(s => s.status === 'online' || s.status === 'warning').length
  return {
    lastUpdate: new Date().toISOString(),
    onlineStations: onlineCount,
    totalStations: stations.length,
    dataLatency: randomInt(10, 120),
  }
}

export function generateHeatmapData(): DistrictHeatmap[] {
  return DISTRICTS.map(district => ({
    district,
    avgAqi: Math.round(randomBetween(40, 130)),
    avgPm25: Math.round(randomBetween(15, 90)),
    stationCount: randomInt(1, 4),
  }))
}

export function generateConstructionSites(): ConstructionSite[] {
  const sites: ConstructionSite[] = []
  for (let i = 0; i < 12; i++) {
    const district = DISTRICTS[i % DISTRICTS.length]
    const startOffset = randomInt(-60, 0)
    const endOffset = randomInt(30, 120)
    sites.push({
      id: `CS${String(i + 1).padStart(3, '0')}`,
      name: `${district}工地${i + 1}号`,
      district,
      lat: 39.9 + (i - 6) * 0.06 + randomBetween(-0.01, 0.01),
      lng: 116.4 + (i - 6) * 0.07 + randomBetween(-0.01, 0.01),
      startDate: new Date(Date.now() + startOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + endOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: i < 8 ? 'active' : 'completed',
    })
  }
  return sites
}

export function generateComplaintData(startDate: string, endDate: string): ComplaintAggregate[] {
  const data: ComplaintAggregate[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (const district of DISTRICTS) {
    let current = new Date(start)
    while (current <= end) {
      const total = randomInt(0, 20)
      data.push({
        district,
        date: current.toISOString().split('T')[0],
        totalCount: total,
        odorCount: randomInt(0, Math.floor(total * 0.3)),
        dustCount: randomInt(0, Math.floor(total * 0.4)),
        noiseCount: randomInt(0, Math.floor(total * 0.5)),
        otherCount: 0,
      })
      current.setDate(current.getDate() + 1)
    }
  }

  data.forEach(item => {
    item.otherCount = Math.max(0, item.totalCount - item.odorCount - item.dustCount - item.noiseCount)
  })

  return data
}

export function generateTrafficData(districts: string[], hours: number = 24): TrafficData[] {
  const data: TrafficData[] = []
  const now = new Date()

  for (const district of districts) {
    for (let i = 0; i < hours; i++) {
      const time = new Date(now.getTime() - (hours - i) * 60 * 60 * 1000)
      const hour = time.getHours()
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
      data.push({
        district,
        timestamp: time.toISOString(),
        vehicleCount: Math.round(randomBetween(500, 3000) * (isRushHour ? 2 : 1)),
        avgSpeed: parseFloat(randomBetween(isRushHour ? 10 : 25, isRushHour ? 30 : 60).toFixed(1)),
      })
    }
  }
  return data
}
