import { Router } from 'express'
import type { ClickHouseDB } from '../types.js'
import { logQuery } from '../types.js'
import { getDistrictGeoJson } from '../db.js'

export function spatialRoutes(db: ClickHouseDB) {
  const router = Router()

  router.get('/bbox', (req, res) => {
    const t0 = Date.now()
    const minLng = parseFloat(req.query.minLng as string) || -180
    const maxLng = parseFloat(req.query.maxLng as string) || 180
    const minLat = parseFloat(req.query.minLat as string) || -90
    const maxLat = parseFloat(req.query.maxLat as string) || 90

    const sql = `SELECT * FROM bin_points WHERE lng >= {minLng:Float64} AND lng <= {maxLng:Float64} AND lat >= {minLat:Float64} AND lat <= {maxLat:Float64} ORDER BY geo_hash`
    const params = { minLng, maxLng, minLat, maxLat }

    const rows = db.binPoints.filter(b => b.lng >= minLng && b.lng <= maxLng && b.lat >= minLat && b.lat <= maxLat)
    logQuery(sql, params, Date.now() - t0, rows.length)
    res.json({ sql, params, data: rows, rowCount: rows.length })
  })

  router.get('/geohash/:prefix', (req, res) => {
    const t0 = Date.now()
    const prefix = req.params.prefix

    const sql = `SELECT * FROM bin_points WHERE geo_hash LIKE {prefix:String} || '%' ORDER BY geo_hash`
    const params = { prefix }

    const rows = db.binPoints.filter(b => b.geo_hash.startsWith(prefix))
    logQuery(sql, params, Date.now() - t0, rows.length)
    res.json({ sql, params, data: rows, rowCount: rows.length })
  })

  router.get('/index', (_req, res) => {
    const t0 = Date.now()
    const sql = `SELECT geo_hash, count() AS cnt, any(id) AS sample_id FROM bin_points GROUP BY geo_hash ORDER BY geo_hash`
    const index = new Map<string, { count: number; sampleId: string }>()
    db.binPoints.forEach(b => {
      const prefix6 = b.geo_hash.substring(0, 6)
      const existing = index.get(prefix6)
      if (existing) { existing.count++ } else { index.set(prefix6, { count: 1, sampleId: b.id }) }
    })
    const data = Array.from(index.entries()).map(([hash, info]) => ({ geoHash: hash, count: info.count, sampleId: info.sampleId }))
    logQuery(sql, {}, Date.now() - t0, data.length)
    res.json({ sql, params: {}, data, rowCount: data.length })
  })

  router.get('/neighbors/:hash', (req, res) => {
    const t0 = Date.now()
    const hash = req.params.hash
    const sql = `SELECT * FROM bin_points WHERE geo_hash IN (SELECT neighbor FROM getGeoHashNeighbors({hash:String})) ORDER BY geo_hash`
    const prefix = hash.substring(0, Math.min(hash.length, 6))
    const rows = db.binPoints.filter(b => b.geo_hash.startsWith(prefix))
    logQuery(sql, { hash }, Date.now() - t0, rows.length)
    res.json({ sql, params: { hash }, data: rows, rowCount: rows.length })
  })

  router.get('/districts/geojson', (_req, res) => {
    const t0 = Date.now()
    const sql = `SELECT district, boundary_polygon FROM district_boundaries ORDER BY district`

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

    logQuery(sql, {}, Date.now() - t0, geoJson.features.length)
    res.json({ sql, params: {}, data: geoJson, rowCount: geoJson.features.length })
  })

  return router
}
