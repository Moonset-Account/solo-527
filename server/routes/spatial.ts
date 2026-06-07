import { Router } from 'express'
import { executeQuery, getFallbackDbSync } from '../clickhouse.js'
import { logQuery } from '../types.js'
import { getDistrictGeoJson } from '../db.js'

export function spatialRoutes() {
  const router = Router()

  router.get('/bbox', async (req, res) => {
    const t0 = Date.now()
    const minLng = parseFloat(req.query.minLng as string) || -180
    const maxLng = parseFloat(req.query.maxLng as string) || 180
    const minLat = parseFloat(req.query.minLat as string) || -90
    const maxLat = parseFloat(req.query.maxLat as string) || 90

    const sql = `SELECT * FROM bin_points WHERE lng >= {minLng:Float64} AND lng <= {maxLng:Float64} AND lat >= {minLat:Float64} AND lat <= {maxLat:Float64} ORDER BY geo_hash`
    const params = { minLng, maxLng, minLat, maxLat }

    const result = await executeQuery(sql, params, () => {
      const db = getFallbackDbSync()
      return db.binPoints.filter(b => b.lng >= minLng && b.lng <= maxLng && b.lat >= minLat && b.lat <= maxLat)
    })

    logQuery(sql, params, Date.now() - t0, result.data.length)
    res.json({ sql, params, data: result.data, rowCount: result.data.length, fromClickHouse: result.fromClickHouse })
  })

  router.get('/geohash/:prefix', async (req, res) => {
    const t0 = Date.now()
    const prefix = req.params.prefix

    const sql = `SELECT * FROM bin_points WHERE geo_hash LIKE {prefix:String} || '%' ORDER BY geo_hash`
    const params = { prefix }

    const result = await executeQuery(sql, params, () => {
      const db = getFallbackDbSync()
      return db.binPoints.filter(b => b.geo_hash.startsWith(prefix))
    })

    logQuery(sql, params, Date.now() - t0, result.data.length)
    res.json({ sql, params, data: result.data, rowCount: result.data.length, fromClickHouse: result.fromClickHouse })
  })

  router.get('/index', async (_req, res) => {
    const t0 = Date.now()
    const sql = `SELECT geo_hash, count() AS cnt, any(id) AS sample_id FROM bin_points GROUP BY geo_hash ORDER BY geo_hash`

    const result = await executeQuery(sql, {}, () => {
      const db = getFallbackDbSync()
      const index = new Map<string, { count: number; sampleId: string }>()
      db.binPoints.forEach(b => {
        const prefix6 = b.geo_hash.substring(0, 6)
        const existing = index.get(prefix6)
        if (existing) { existing.count++ } else { index.set(prefix6, { count: 1, sampleId: b.id }) }
      })
      return Array.from(index.entries()).map(([hash, info]) => ({ geoHash: hash, count: info.count, sampleId: info.sampleId }))
    })

    logQuery(sql, {}, Date.now() - t0, result.data.length)
    res.json({ sql, params: {}, data: result.data, rowCount: result.data.length, fromClickHouse: result.fromClickHouse })
  })

  router.get('/neighbors/:hash', async (req, res) => {
    const t0 = Date.now()
    const hash = req.params.hash
    const sql = `SELECT * FROM bin_points WHERE geo_hash IN (SELECT neighbor FROM getGeoHashNeighbors({hash:String})) ORDER BY geo_hash`

    const result = await executeQuery(sql, { hash }, () => {
      const db = getFallbackDbSync()
      const prefix = hash.substring(0, Math.min(hash.length, 6))
      return db.binPoints.filter(b => b.geo_hash.startsWith(prefix))
    })

    logQuery(sql, { hash }, Date.now() - t0, result.data.length)
    res.json({ sql, params: { hash }, data: result.data, rowCount: result.data.length, fromClickHouse: result.fromClickHouse })
  })

  router.get('/districts/geojson', async (_req, res) => {
    const t0 = Date.now()
    const sql = `SELECT district, boundary_polygon FROM district_boundaries ORDER BY district`

    const result = await executeQuery(sql, {}, () => {
      const db = getFallbackDbSync()
      const districtMap = new Map<string, number>()
      db.binPoints.forEach(b => {
        const comm = db.communities.find(c => c.id === b.community_id)
        const district = comm?.district || '未知'
        districtMap.set(district, (districtMap.get(district) || 0) + 1)
      })

      const geoJson = getDistrictGeoJson()
      geoJson.features.forEach((f: any) => {
        f.properties.binCount = districtMap.get(f.properties.name) || 0
      })
      return [geoJson]
    })

    const data = result.data[0] || getDistrictGeoJson()
    logQuery(sql, {}, Date.now() - t0, result.fromClickHouse ? result.data.length : (data as any).features?.length || 0)
    res.json({ sql, params: {}, data, rowCount: (data as any).features?.length || 0, fromClickHouse: result.fromClickHouse })
  })

  return router
}
