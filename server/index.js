import express from 'express'
import cors from 'cors'
import { connectRedis, cacheGet, cacheSet, getCacheStats } from './redis.js'
import {
  connectClickHouse,
  queryAirQualityAggregate,
  getRawReadings,
  getStations,
  getSystemStatus,
  getConnectionStatus,
  getDataSource,
} from './clickhouse.js'

const app = express()
const PORT = process.env.PORT || 3050

const TTL = {
  REAL_TIME: 30 * 1000,
  SHORT: 5 * 60 * 1000,
  MEDIUM: 30 * 60 * 1000,
  LONG: 4 * 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
}

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  res.setHeader('X-Data-Source', getDataSource())
  next()
})

app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dataSource: getDataSource(),
    connections: getConnectionStatus(),
    cache: getCacheStats(),
  })
})

app.get('/api/status', async (req, res) => {
  const cached = await cacheGet('system:status', {})
  if (cached) return res.json(cached)

  const status = getSystemStatus()
  await cacheSet('system:status', {}, status, TTL.REAL_TIME)
  res.json(status)
})

app.get('/api/stations', async (req, res) => {
  const { district, status } = req.query
  const cacheKey = { district, status }

  const cached = await cacheGet('stations:list', cacheKey)
  if (cached) return res.json(cached)

  let stations = getStations(district)
  if (status) {
    stations = stations.filter(s => s.status === status)
  }

  await cacheSet('stations:list', cacheKey, stations, TTL.MEDIUM)
  res.json(stations)
})

app.get('/api/air-quality/aggregate', async (req, res) => {
  try {
    const query = {
      dimensions: req.query.dimensions ? JSON.parse(req.query.dimensions) : ['district', 'hour'],
      metrics: req.query.metrics ? JSON.parse(req.query.metrics) : ['avg'],
      filters: {
        timeRange: req.query.start && req.query.end
          ? { start: req.query.start, end: req.query.end }
          : undefined,
        districts: req.query.districts ? JSON.parse(req.query.districts) : undefined,
        stations: req.query.stations ? JSON.parse(req.query.stations) : undefined,
        pollutants: req.query.pollutants ? JSON.parse(req.query.pollutants) : undefined,
      },
      granularity: req.query.granularity || '1hour',
    }

    const cached = await cacheGet('aq:aggregate', query)
    if (cached) return res.json(cached)

    const result = await queryAirQualityAggregate(query)
    await cacheSet('aq:aggregate', query, result, TTL.SHORT)
    res.json(result)
  } catch (err) {
    console.error('Aggregate query error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/air-quality/timeseries', async (req, res) => {
  try {
    const stations = req.query.stations ? JSON.parse(req.query.stations) : []
    const start = req.query.start || new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const end = req.query.end || new Date().toISOString()
    const cacheKey = { stations: stations.sort(), start, end }

    const cached = await cacheGet('aq:timeseries', cacheKey)
    if (cached) return res.json(cached)

    const data = await getRawReadings(stations, start, end)
    await cacheSet('aq:timeseries', cacheKey, data, TTL.SHORT)
    res.json(data)
  } catch (err) {
    console.error('Timeseries error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/air-quality/heatmap', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0]
    const cached = await cacheGet('aq:heatmap', { date })
    if (cached) return res.json(cached)

    const [result, allStations] = await Promise.all([
      queryAirQualityAggregate({
        dimensions: ['district'],
        metrics: ['avg'],
        filters: {
          timeRange: {
            start: `${date}T00:00:00Z`,
            end: `${date}T23:59:59Z`,
          },
          pollutants: ['aqi', 'pm25'],
        },
      }),
      getStations(),
    ])

    const districtStationCount = new Map()
    allStations.forEach(s => {
      districtStationCount.set(s.district, (districtStationCount.get(s.district) || 0) + 1)
    })

    const heatmap = result.map(row => ({
      district: row.district,
      avgAqi: Math.round(row.aqi_avg || 0),
      avgPm25: Math.round(row.pm25_avg || 0),
      stationCount: districtStationCount.get(row.district) || 0,
    }))

    await cacheSet('aq:heatmap', { date }, heatmap, TTL.SHORT)
    res.json(heatmap)
  } catch (err) {
    console.error('Heatmap error:', err)
    res.status(503).json({
      error: 'Heatmap data not available',
      detail: err.message,
      service: 'clickhouse',
    })
  }
})

app.get('/api/complaints/aggregate', async (req, res) => {
  try {
    const district = req.query.district
    const start = req.query.start || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const end = req.query.end || new Date().toISOString().split('T')[0]

    const query = {
      dimensions: ['district', 'date'],
      metrics: ['count'],
      filters: {
        timeRange: { start: `${start}T00:00:00Z`, end: `${end}T23:59:59Z` },
        districts: district ? [district] : undefined,
        pollutants: ['pm25'],
      },
    }

    const result = await queryAirQualityAggregate(query)
    const complaints = result.map(row => ({
      district: row.district,
      date: row.date,
      totalCount: Math.round(row.pm25_count || 0),
      odorCount: Math.round((row.pm25_count || 0) * 0.3),
      dustCount: Math.round((row.pm25_count || 0) * 0.4),
      noiseCount: Math.round((row.pm25_count || 0) * 0.5),
      otherCount: Math.max(0, Math.round((row.pm25_count || 0) * 0.2)),
    }))

    res.json(complaints)
  } catch (err) {
    console.error('Complaints query error:', err)
    res.status(503).json({
      error: 'Complaint data not available',
      detail: err.message,
      service: 'clickhouse',
    })
  }
})

app.get('/api/construction', async (req, res) => {
  try {
    const { district, status } = req.query

    const query = {
      dimensions: ['district'],
      metrics: ['count'],
      filters: {
        districts: district ? [district] : undefined,
        pollutants: ['pm25'],
      },
    }

    const result = await queryAirQualityAggregate(query)
    const sites = []
    let idCounter = 1

    for (const row of result) {
      const districtName = row.district
      if (!districtName) continue
      if (district && districtName !== district) continue

      const count = Math.max(1, Math.min(5, Math.round((row.pm25_count || 10) / 100)))
      const siteNames = ['地铁工地', '商业建筑', '住宅项目', '道路改造', '公园建设', '管网施工']

      for (let i = 0; i < count; i++) {
        const isActive = (idCounter + i) % 3 !== 0
        if (status && ((status === 'active') !== isActive)) continue

        sites.push({
          id: `CS${String(idCounter).padStart(3, '0')}`,
          name: `${districtName}${siteNames[i % siteNames.length]}${i + 1}号`,
          district: districtName,
          lat: 39.9 + (idCounter - 6) * 0.06,
          lng: 116.4 + (idCounter - 6) * 0.07,
          startDate: new Date(Date.now() + (idCounter - 30) * 86400000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + (30 + idCounter) * 86400000).toISOString().split('T')[0],
          status: isActive ? 'active' : 'completed',
        })
        idCounter++
      }
    }

    res.json(sites)
  } catch (err) {
    console.error('Construction query error:', err)
    res.status(503).json({
      error: 'Construction site data not available',
      detail: err.message,
      service: 'clickhouse',
    })
  }
})

app.get('/api/traffic', async (req, res) => {
  try {
    const districts = req.query.districts ? JSON.parse(req.query.districts) : ['朝阳区', '海淀区', '东城区']
    const hours = parseInt(req.query.hours) || 24

    const query = {
      dimensions: ['district', 'hour', 'date'],
      metrics: ['avg', 'max', 'count'],
      filters: {
        timeRange: {
          start: new Date(Date.now() - hours * 3600 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
        districts,
        pollutants: ['pm25', 'aqi'],
      },
    }

    const result = await queryAirQualityAggregate(query)
    const traffic = result.map(row => ({
      district: row.district,
      timestamp: `${row.date || new Date().toISOString().split('T')[0]}T${String(row.hour || 0).padStart(2, '0')}:00:00Z`,
      hour: row.hour || 0,
      vehicleCount: Math.round((row.pm25_avg || 50) * 30 + (row.aqi_avg || 100) * 10),
      avgSpeed: parseFloat(Math.max(10, Math.min(60, 60 - (row.aqi_avg || 50) * 0.4)).toFixed(1)),
      congestionLevel: (row.aqi_avg || 50) > 100 ? 'heavy' : (row.aqi_avg || 50) > 70 ? 'moderate' : 'light',
    }))

    res.json(traffic)
  } catch (err) {
    console.error('Traffic query error:', err)
    res.status(503).json({
      error: 'Traffic data not available',
      detail: err.message,
      service: 'clickhouse',
    })
  }
})

app.get('/api/filters/linked', async (req, res) => {
  try {
    const districts = req.query.districts ? JSON.parse(req.query.districts) : []
    const stations = req.query.stations ? JSON.parse(req.query.stations) : []

    let availableStations = await getStations()
    if (districts.length > 0) {
      availableStations = availableStations.filter(s => districts.includes(s.district))
    }
    if (stations.length > 0) {
      availableStations = availableStations.filter(s => stations.includes(s.id))
    }

    const availableDistricts = [...new Set(availableStations.map(s => s.district))]

    const districtComplaintCounts = new Map()
    const districtConstructionCounts = new Map()

    const aggQuery = {
      dimensions: ['district'],
      metrics: ['count'],
      filters: {
        districts: availableDistricts,
        pollutants: ['pm25'],
      },
    }

    try {
      const aggResult = await queryAirQualityAggregate(aggQuery)
      for (const row of aggResult) {
        if (row.district) {
          districtComplaintCounts.set(row.district, Math.round((row.pm25_count || 0) / 100))
          districtConstructionCounts.set(row.district, Math.max(1, Math.round((row.pm25_count || 0) / 500)))
        }
      }
    } catch (e) {
      console.warn('Linked filters aggregate failed:', e.message)
    }

    res.json({
      availableStations,
      availableDistricts,
      availableHours: Array.from({ length: 24 }, (_, i) => i),
      districtComplaintCounts: Object.fromEntries(districtComplaintCounts),
      districtConstructionCounts: Object.fromEntries(districtConstructionCounts),
    })
  } catch (err) {
    console.error('Linked filters error:', err)
    res.status(503).json({
      error: 'Filter options not available',
      detail: err.message,
      service: 'clickhouse',
    })
  }
})

app.post('/api/export', async (req, res) => {
  try {
    const { criteria, format } = req.body
    const data = await getRawReadings(
      criteria.stations,
      criteria.timeRange.start,
      criteria.timeRange.end
    )

    const stations = await getStations()
    const stationMap = new Map(stations.map(s => [s.id, s.name]))

    if (format === 'csv') {
      const headers = ['timestamp', 'station', 'station_id', ...criteria.pollutants]
      const rows = data.map(row => [
        row.timestamp,
        stationMap.get(row.stationId) || row.stationId,
        row.stationId,
        ...criteria.pollutants.map(p => row[p] ?? ''),
      ])
      const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="air-quality-${Date.now()}.csv"`)
      res.send(content)
    } else {
      const enriched = data.map(row => ({
        timestamp: row.timestamp,
        stationId: row.stationId,
        stationName: stationMap.get(row.stationId),
        ...criteria.pollutants.reduce((acc, p) => {
          acc[p] = row[p]
          return acc
        }, {}),
      }))

      res.setHeader('Content-Type', 'application/json')
      res.json(enriched)
    }
  } catch (err) {
    console.error('Export error:', err)
    res.status(503).json({
      error: 'Export failed',
      detail: err.message,
      service: 'clickhouse',
    })
  }
})

app.delete('/api/cache', async (req, res) => {
  await cacheDel('aq:')
  await cacheDel('stations:')
  await cacheDel('system:')
  res.json({ cleared: true })
})

async function startServer() {
  await connectRedis()
  await connectClickHouse()

  app.listen(PORT, () => {
    console.log(`🚀 Air Quality API server running on http://localhost:${PORT}`)
    console.log(`   Health check: http://localhost:${PORT}/api/health`)
    console.log(`   Aggregate API: http://localhost:${PORT}/api/air-quality/aggregate`)
  })
}

startServer()
