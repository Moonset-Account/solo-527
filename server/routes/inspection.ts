import { Router } from 'express'
import type { ClickHouseDB } from '../types.js'
import { logQuery } from '../types.js'

export function inspectionRoutes(db: ClickHouseDB) {
  const router = Router()

  router.get('/coverage', (_req, res) => {
    const t0 = Date.now()
    const sql = `SELECT c.name AS community_name, count(DISTINCT bp.id) AS bin_count, count(DISTINCT ip.bin_point_id) AS inspected_count, round(count(DISTINCT ip.bin_point_id) / count(DISTINCT bp.id) * 100, 1) AS coverage_rate FROM communities c JOIN bin_points bp ON bp.community_id = c.id LEFT JOIN inspection_photos ip ON ip.bin_point_id = bp.id GROUP BY c.name ORDER BY coverage_rate DESC`

    const data = db.communities.map(comm => {
      const bins = db.binPoints.filter(b => b.community_id === comm.id)
      const inspectedBins = new Set(db.inspectionPhotos.filter(p => bins.some(b => b.id === p.bin_point_id)).map(p => p.bin_point_id))
      return {
        communityId: comm.id, communityName: comm.name, district: comm.district,
        binCount: bins.length, inspectedCount: inspectedBins.size,
        coverageRate: bins.length > 0 ? parseFloat((inspectedBins.size / bins.length * 100).toFixed(1)) : 0
      }
    }).sort((a, b) => b.coverageRate - a.coverageRate)

    logQuery(sql, {}, Date.now() - t0, data.length)
    res.json({ sql, params: {}, data, rowCount: data.length })
  })

  router.get('/return-visits', (req, res) => {
    const t0 = Date.now()
    const binPointId = req.query.binPointId as string

    let sql = `SELECT rv.*, bp.name AS bin_name FROM return_visits rv JOIN bin_points bp ON rv.bin_point_id = bp.id`
    const params: Record<string, any> = {}
    if (binPointId) { sql += ` WHERE rv.bin_point_id = {binPointId:String}`; params.binPointId = binPointId }
    sql += ` ORDER BY rv.visit_time DESC`

    let data = db.returnVisits
    if (binPointId) data = data.filter(v => v.bin_point_id === binPointId)

    const result = data.map(v => {
      const bin = db.binPoints.find(b => b.id === v.bin_point_id)
      return { ...v, binName: bin?.name || '未知' }
    })

    logQuery(sql, params, Date.now() - t0, result.length)
    res.json({ sql, params, data: result, rowCount: result.length })
  })

  return router
}
