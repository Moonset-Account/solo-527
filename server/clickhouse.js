import { createClient } from '@clickhouse/client'
import { randomInt } from 'crypto'

const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123'
const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER || 'default'
const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || ''
const CLICKHOUSE_DATABASE = process.env.CLICKHOUSE_DATABASE || 'default'
const CLICKHOUSE_FALLBACK = process.env.CLICKHOUSE_FALLBACK === 'true'

export const DATA_SOURCE = {
  REAL: 'clickhouse',
  FALLBACK: 'fallback-mock',
}

let clickHouseClient = null
let useFallback = false
let clickHouseReady = false
let currentDataSource = DATA_SOURCE.REAL
let fallbackData = null

const DISTRICTS = [
  '东城区', '西城区', '朝阳区', '海淀区', '丰台区',
  '石景山区', '通州区', '顺义区', '大兴区', '昌平区'
]

const STATION_NAMES = [
  '奥体中心', '前门', '万寿西宫', '官园', '天坛',
  '农展馆', '万柳', '北部新区', '植物园', '顺义新城',
  '昌平镇', '南三环', '亦庄', '通州', '大兴黄村',
  '房山', '门头沟', '平谷', '怀柔', '密云',
]

function generateStationId(index) {
  return `ST${String(index + 1).padStart(3, '0')}`
}

function initFallbackData() {
  if (fallbackData) return

  const stations = []
  for (let i = 0; i < 20; i++) {
    const district = DISTRICTS[i % DISTRICTS.length]
    stations.push({
      id: generateStationId(i),
      name: STATION_NAMES[i % STATION_NAMES.length],
      district,
      lat: 39.9 + (i - 10) * 0.05,
      lng: 116.4 + (i - 10) * 0.06,
      status: i === 3 || i === 15 ? 'offline' : i === 7 ? 'warning' : 'online',
      lastUpdate: new Date(Date.now() - Math.random() * 15 * 60 * 1000).toISOString(),
    })
  }

  const readings = []
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
  const intervalMs = 5 * 60 * 1000

  for (const station of stations) {
    let currentTime = new Date(startDate)
    while (currentTime <= endDate) {
      const hour = currentTime.getHours()
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
      const multiplier = isRushHour ? 1.5 : 1
      readings.push({
        stationId: station.id,
        district: station.district,
        timestamp: currentTime.toISOString(),
        date: currentTime.toISOString().split('T')[0],
        hour,
        pm25: Math.round((10 + Math.random() * 70) * multiplier),
        pm10: Math.round((20 + Math.random() * 130) * multiplier),
        ozone: Math.round(30 + Math.random() * 150 * (1 + Math.sin((hour - 12) * Math.PI / 12) * 0.3)),
        no2: Math.round((10 + Math.random() * 70) * multiplier),
        so2: Math.round(2 + Math.random() * 28),
        co: parseFloat(((0.3 + Math.random() * 1.7) * multiplier).toFixed(1)),
        aqi: Math.round((30 + Math.random() * 120) * multiplier),
        windDirection: Math.round(Math.random() * 360),
        windSpeed: parseFloat((0.5 + Math.random() * 4.5).toFixed(1)),
        temperature: parseFloat((10 + Math.random() * 20).toFixed(1)),
        humidity: Math.round(20 + Math.random() * 70),
      })
      currentTime = new Date(currentTime.getTime() + intervalMs)
    }
  }

  fallbackData = { stations, readings }
  console.log('[ClickHouse] Fallback mock data initialized (20 stations, 7 days, 5min interval)')
}

async function connectClickHouse() {
  try {
    clickHouseClient = createClient({
      url: CLICKHOUSE_URL,
      username: CLICKHOUSE_USER,
      password: CLICKHOUSE_PASSWORD,
      database: CLICKHOUSE_DATABASE,
      clickhouse_settings: {
        allow_experimental_object_type: 1,
      },
    })

    await clickHouseClient.ping()
    console.log('[ClickHouse] Connected successfully')
    clickHouseReady = true
    useFallback = false
    currentDataSource = DATA_SOURCE.REAL
    return true
  } catch (err) {
    console.error('[ClickHouse] Connection failed:', err.message)
    if (CLICKHOUSE_FALLBACK) {
      console.warn('[ClickHouse] Using EXPLICIT fallback mock data (CLICKHOUSE_FALLBACK=true)')
      console.warn('[ClickHouse] WARNING: All queries will return MOCK data, not real ClickHouse data!')
      initFallbackData()
      useFallback = true
      currentDataSource = DATA_SOURCE.FALLBACK
      return false
    }
    throw new Error(`ClickHouse connection failed: ${err.message}`)
  }
}

function getDataSource() {
  return currentDataSource
}

function assertClickHouseAvailable() {
  if (useFallback) return true
  if (!clickHouseClient || !clickHouseReady) {
    throw new Error('ClickHouse service is not available')
  }
  return true
}

function runFallbackAggregate(query) {
  if (!fallbackData) return []
  const { dimensions = [], metrics = ['avg'], filters = {} } = query
  let data = [...fallbackData.readings]

  if (filters.timeRange) {
    const start = new Date(filters.timeRange.start).getTime()
    const end = new Date(filters.timeRange.end).getTime()
    data = data.filter(r => {
      const ts = new Date(r.timestamp).getTime()
      return ts >= start && ts <= end
    })
  }
  if (filters.districts?.length) {
    data = data.filter(r => filters.districts.includes(r.district))
  }
  if (filters.stations?.length) {
    data = data.filter(r => filters.stations.includes(r.stationId))
  }

  const pollutants = filters.pollutants || ['pm25', 'pm10', 'ozone', 'no2', 'aqi']
  const grouped = new Map()

  for (const row of data) {
    const key = dimensions.map(d => {
      if (d === 'station') return row.stationId
      if (d === 'district') return row.district
      if (d === 'hour') return String(row.hour).padStart(2, '0')
      if (d === 'date') return row.date
      return ''
    }).join('|||')

    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(row)
  }

  const results = []
  for (const [key, rows] of grouped) {
    const keyParts = key.split('|||')
    const result = {}
    dimensions.forEach((d, idx) => {
      if (d === 'station') {
        result.stationId = keyParts[idx]
        result.stationName = fallbackData.stations.find(s => s.id === keyParts[idx])?.name || keyParts[idx]
      } else if (d === 'district') {
        result.district = keyParts[idx]
      } else if (d === 'hour') {
        result.hour = parseInt(keyParts[idx])
        result.hour_label = `${keyParts[idx]}:00`
      } else if (d === 'date') {
        result.date = keyParts[idx]
      }
    })

    for (const p of pollutants) {
      const values = rows.map(r => r[p]).filter(v => v != null && !isNaN(v))
      if (values.length === 0) continue
      if (metrics.includes('avg')) result[`${p}_avg`] = parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
      if (metrics.includes('max')) result[`${p}_max`] = Math.max(...values)
      if (metrics.includes('min')) result[`${p}_min`] = Math.min(...values)
      if (metrics.includes('count')) result[`${p}_count`] = values.length
    }
    result.sample_count = rows.length
    results.push(result)
  }

  return results
}

async function queryAirQualityAggregate(query) {
  assertClickHouseAvailable()

  if (useFallback) {
    console.warn('[ClickHouse] Using FALLBACK MOCK data for aggregate query')
    return runFallbackAggregate(query)
  }

  const { dimensions = [], metrics = ['avg'], filters = {} } = query
  const selectFields = []
  const groupFields = []

  dimensions.forEach(dim => {
    if (dim === 'station') {
      selectFields.push('stationId', 'any(stationId) as station_name')
      groupFields.push('stationId')
    } else if (dim === 'district') {
      selectFields.push('district')
      groupFields.push('district')
    } else if (dim === 'hour') {
      selectFields.push('hour')
      groupFields.push('hour')
    } else if (dim === 'date') {
      selectFields.push('date')
      groupFields.push('date')
    }
  })

  const pollutants = filters.pollutants || ['pm25', 'pm10', 'ozone', 'no2', 'aqi']
  pollutants.forEach(p => {
    metrics.forEach(m => {
      if (m === 'avg') selectFields.push(`avg(${p}) as ${p}_avg`)
      if (m === 'max') selectFields.push(`max(${p}) as ${p}_max`)
      if (m === 'min') selectFields.push(`min(${p}) as ${p}_min`)
      if (m === 'count') selectFields.push(`count(${p}) as ${p}_count`)
    })
  })

  const whereClauses = []
  if (filters.timeRange) {
    whereClauses.push(`timestamp >= '${filters.timeRange.start}'`)
    whereClauses.push(`timestamp <= '${filters.timeRange.end}'`)
  }
  if (filters.districts?.length) {
    whereClauses.push(`district IN (${filters.districts.map(d => `'${d}'`).join(', ')})`)
  }
  if (filters.stations?.length) {
    whereClauses.push(`stationId IN (${filters.stations.map(s => `'${s}'`).join(', ')})`)
  }

  const sql = `
    SELECT ${selectFields.join(', ')}
    FROM air_quality
    ${whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : ''}
    ${groupFields.length ? 'GROUP BY ' + groupFields.join(', ') : ''}
    ${groupFields.length ? 'ORDER BY ' + groupFields.join(', ') : ''}
    FORMAT JSON
  `

  try {
    const result = await clickHouseClient.query({ query: sql })
    const data = await result.json()
    return data.data || []
  } catch (err) {
    console.error('[ClickHouse] Query error:', err.message)
    clickHouseReady = false
    if (CLICKHOUSE_FALLBACK) {
      console.warn('[ClickHouse] Falling back to MOCK data due to query error')
      initFallbackData()
      useFallback = true
      currentDataSource = DATA_SOURCE.FALLBACK
      return runFallbackAggregate(query)
    }
    throw new Error(`ClickHouse query failed: ${err.message}`)
  }
}

async function getRawReadings(stationIds, start, end) {
  assertClickHouseAvailable()

  if (useFallback) {
    console.warn('[ClickHouse] Using FALLBACK MOCK data for raw readings')
    if (!fallbackData) return []
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    return fallbackData.readings.filter(r =>
      stationIds.includes(r.stationId) &&
      new Date(r.timestamp).getTime() >= startTime &&
      new Date(r.timestamp).getTime() <= endTime
    ).map(r => ({
      stationId: r.stationId,
      timestamp: r.timestamp,
      pm25: r.pm25,
      pm10: r.pm10,
      ozone: r.ozone,
      no2: r.no2,
      so2: r.so2,
      co: r.co,
      aqi: r.aqi,
      windDirection: r.windDirection,
      windSpeed: r.windSpeed,
      temperature: r.temperature,
      humidity: r.humidity,
    }))
  }

  const sql = `
    SELECT * FROM air_quality
    WHERE stationId IN (${stationIds.map(s => `'${s}'`).join(', ')})
      AND timestamp >= '${start}'
      AND timestamp <= '${end}'
    ORDER BY timestamp ASC
    FORMAT JSON
  `

  try {
    const result = await clickHouseClient.query({ query: sql })
    const data = await result.json()
    return data.data || []
  } catch (err) {
    console.error('[ClickHouse] Raw query error:', err.message)
    clickHouseReady = false
    if (CLICKHOUSE_FALLBACK) {
      console.warn('[ClickHouse] Falling back to MOCK data')
      initFallbackData()
      useFallback = true
      currentDataSource = DATA_SOURCE.FALLBACK
      const startTime = new Date(start).getTime()
      const endTime = new Date(end).getTime()
      return fallbackData?.readings.filter(r =>
        stationIds.includes(r.stationId) &&
        new Date(r.timestamp).getTime() >= startTime &&
        new Date(r.timestamp).getTime() <= endTime
      ).map(r => ({
        stationId: r.stationId,
        timestamp: r.timestamp,
        pm25: r.pm25,
        pm10: r.pm10,
        ozone: r.ozone,
        no2: r.no2,
        so2: r.so2,
        co: r.co,
        aqi: r.aqi,
        windDirection: r.windDirection,
        windSpeed: r.windSpeed,
        temperature: r.temperature,
        humidity: r.humidity,
      })) || []
    }
    throw new Error(`ClickHouse raw query failed: ${err.message}`)
  }
}

async function getStations(district) {
  assertClickHouseAvailable()

  if (useFallback) {
    console.warn('[ClickHouse] Using FALLBACK MOCK data for stations')
    if (!fallbackData) return []
    let stations = [...fallbackData.stations]
    if (district) stations = stations.filter(s => s.district === district)
    return stations
  }

  const where = district ? `WHERE district = '${district}'` : ''
  const sql = `
    SELECT DISTINCT stationId as id, any(stationName) as name, any(district) as district,
           any(lat) as lat, any(lng) as lng, any(status) as status, max(timestamp) as lastUpdate
    FROM air_quality
    ${where}
    GROUP BY stationId
    FORMAT JSON
  `

  try {
    const result = await clickHouseClient.query({ query: sql })
    const data = await result.json()
    return data.data || []
  } catch (err) {
    console.error('[ClickHouse] Stations query error:', err.message)
    clickHouseReady = false
    if (CLICKHOUSE_FALLBACK) {
      console.warn('[ClickHouse] Falling back to MOCK data')
      initFallbackData()
      useFallback = true
      currentDataSource = DATA_SOURCE.FALLBACK
      let stations = fallbackData?.stations || []
      if (district) stations = stations.filter(s => s.district === district)
      return stations
    }
    throw new Error(`ClickHouse stations query failed: ${err.message}`)
  }
}

async function getSystemStatus() {
  try {
    const stations = await getStations()
    const onlineCount = stations.filter(s => s.status === 'online' || s.status === 'warning').length
    return {
      lastUpdate: new Date().toISOString(),
      onlineStations: onlineCount,
      totalStations: stations.length,
      dataLatency: 0,
      dataSource: getDataSource(),
    }
  } catch (err) {
    throw new Error(`ClickHouse status query failed: ${err.message}`)
  }
}

function getConnectionStatus() {
  return {
    clickhouse: {
      status: useFallback ? 'fallback-mock' : (clickHouseReady ? 'connected' : 'disconnected'),
      dataSource: getDataSource(),
    },
  }
}

export {
  connectClickHouse,
  queryAirQualityAggregate,
  getRawReadings,
  getStations,
  getSystemStatus,
  getConnectionStatus,
  getDataSource,
}
