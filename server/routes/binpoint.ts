import { Router } from 'express'
import type { ClickHouseDB } from '../types.js'
import { logQuery } from '../types.js'

export function binPointRoutes(db: ClickHouseDB) {
  const router = Router()

  router.get('/', (req, res) => {
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

    let data = db.binPoints.map(b => {
      const comm = db.communities.find(c => c.id === b.community_id)
      return { ...b, communityName: comm?.name || '未知', district: comm?.district || '未知' }
    })
    if (status && status !== 'all') data = data.filter(b => b.status === status)
    if (communityId && communityId !== 'all') data = data.filter(b => b.community_id === communityId)
    if (district && district !== 'all') data = data.filter(b => b.district === district)

    logQuery(sql, params, Date.now() - t0, data.length)
    res.json({ sql, params, data, rowCount: data.length })
  })

  router.get('/stats', (_req, res) => {
    const t0 = Date.now()
    const sql = `SELECT status, count() AS count FROM bin_points GROUP BY status`
    const data = {
      total: db.binPoints.length,
      normal: db.binPoints.filter(b => b.status === 'normal').length,
      warning: db.binPoints.filter(b => b.status === 'warning').length,
      full: db.binPoints.filter(b => b.status === 'full').length,
      abnormal: db.binPoints.filter(b => b.status === 'abnormal').length
    }
    logQuery(sql, {}, Date.now() - t0, 4)
    res.json({ sql, params: {}, data })
  })

  router.get('/:id', (req, res) => {
    const t0 = Date.now()
    const id = req.params.id
    const sql = `SELECT bp.*, c.name AS community_name, c.district FROM bin_points bp JOIN communities c ON bp.community_id = c.id WHERE bp.id = {id:String}`
    const bin = db.binPoints.find(b => b.id === id)
    if (!bin) { res.status(404).json({ error: 'Not found' }); return }
    const comm = db.communities.find(c => c.id === bin.community_id)
    const data = { ...bin, communityName: comm?.name || '未知', district: comm?.district || '未知' }
    logQuery(sql, { id }, Date.now() - t0, 1)
    res.json({ sql, params: { id }, data })
  })

  return router
}
