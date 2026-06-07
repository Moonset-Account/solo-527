import { Router } from 'express'
import { executeQuery, getFallbackDbSync } from '../clickhouse.js'
import { logQuery } from '../types.js'

export function binPointRoutes() {
  const router = Router()

  router.get('/', async (req, res) => {
    const t0 = Date.now()
    const status = req.query.status as string
    const district = req.query.district as string
    const communityId = req.query.communityId as string

    let sql = `SELECT bp.*, c.name AS community_name, c.district FROM bin_points bp JOIN communities c ON bp.community_id = c.id WHERE 1=1`
    const params: Record<string, any> = {}

    if (status && status !== 'all') { sql += ` AND bp.status = {status:String}`; params.status = status }
    if (communityId && communityId !== 'all') { sql += ` AND bp.community_id = {communityId:String}`; params.communityId = communityId }
    if (district && district !== 'all') { sql += ` AND c.district = {district:String}`; params.district = district }
    sql += ` ORDER BY bp.id`

    const result = await executeQuery(sql, params, () => {
      const db = getFallbackDbSync()
      let data = db.binPoints.map(b => {
        const comm = db.communities.find(c => c.id === b.community_id)
        return { ...b, communityName: comm?.name || '未知', district: comm?.district || '未知' }
      })
      if (status && status !== 'all') data = data.filter(b => b.status === status)
      if (communityId && communityId !== 'all') data = data.filter(b => b.community_id === communityId)
      if (district && district !== 'all') data = data.filter(b => b.district === district)
      return data
    })

    logQuery(sql, params, Date.now() - t0, result.data.length)
    res.json({ sql, params, data: result.data, rowCount: result.data.length, fromClickHouse: result.fromClickHouse })
  })

  router.get('/stats', async (_req, res) => {
    const t0 = Date.now()
    const sql = `SELECT status, count() AS count FROM bin_points GROUP BY status`

    const result = await executeQuery(sql, {}, () => {
      const db = getFallbackDbSync()
      return [{
        total: db.binPoints.length,
        normal: db.binPoints.filter(b => b.status === 'normal').length,
        warning: db.binPoints.filter(b => b.status === 'warning').length,
        full: db.binPoints.filter(b => b.status === 'full').length,
        abnormal: db.binPoints.filter(b => b.status === 'abnormal').length
      }]
    })

    logQuery(sql, {}, Date.now() - t0, 4)
    res.json({ sql, params: {}, data: result.data[0], fromClickHouse: result.fromClickHouse })
  })

  router.get('/:id', async (req, res) => {
    const t0 = Date.now()
    const id = req.params.id
    const sql = `SELECT bp.*, c.name AS community_name, c.district FROM bin_points bp JOIN communities c ON bp.community_id = c.id WHERE bp.id = {id:String}`

    const result = await executeQuery(sql, { id }, () => {
      const db = getFallbackDbSync()
      const bin = db.binPoints.find(b => b.id === id)
      if (!bin) return []
      const comm = db.communities.find(c => c.id === bin.community_id)
      return [{ ...bin, communityName: comm?.name || '未知', district: comm?.district || '未知' }]
    })

    if (result.data.length === 0) { res.status(404).json({ error: 'Not found' }); return }
    logQuery(sql, { id }, Date.now() - t0, 1)
    res.json({ sql, params: { id }, data: result.data[0], fromClickHouse: result.fromClickHouse })
  })

  return router
}
