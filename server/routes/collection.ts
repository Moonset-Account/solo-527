import { Router } from 'express'
import type { ClickHouseDB } from '../types.js'
import { logQuery } from '../types.js'

export function collectionRoutes(db: ClickHouseDB) {
  const router = Router()

  router.get('/efficiency/time-window', (req, res) => {
    const t0 = Date.now()
    const startDate = (req.query.startDate as string) || '2024-01-01'
    const excludeHolidays = req.query.excludeHolidays !== 'false'

    let sql = `SELECT time_window, count() AS total_count, countIf(status = 'completed') AS completed_count, round(countIf(status = 'completed') / count() * 100, 1) AS on_time_rate FROM collection_logs WHERE plan_time >= {startDate:DateTime}`
    const params: Record<string, any> = { startDate }

    if (excludeHolidays) {
      sql += ` AND is_holiday = 0`
      params.excludeHolidays = true
    }

    if (req.query.communityId && req.query.communityId !== 'all') {
      sql += ` AND bin_point_id IN (SELECT id FROM bin_points WHERE community_id = {communityId:String})`
      params.communityId = req.query.communityId
    }
    sql += ` GROUP BY time_window ORDER BY time_window`

    let logs = db.collectionLogs.filter(l => new Date(l.plan_time).toISOString().split('T')[0] >= startDate)
    if (excludeHolidays) logs = logs.filter(l => l.is_holiday === 0)

    if (req.query.communityId && req.query.communityId !== 'all') {
      const binIds = new Set(db.binPoints.filter(b => b.community_id === req.query.communityId).map(b => b.id))
      logs = logs.filter(l => binIds.has(l.bin_point_id))
    }

    const windowMap = new Map<string, { total: number; completed: number }>()
    logs.forEach(l => {
      const existing = windowMap.get(l.time_window) || { total: 0, completed: 0 }
      existing.total++; if (l.status === 'completed') existing.completed++
      windowMap.set(l.time_window, existing)
    })

    const data = Array.from(windowMap.entries()).map(([window, d]) => ({
      timeWindow: window, totalCount: d.total, completedCount: d.completed,
      onTimeRate: d.total > 0 ? parseFloat((d.completed / d.total * 100).toFixed(1)) : 0
    }))

    logQuery(sql, params, Date.now() - t0, data.length)
    res.json({ sql, params, data, rowCount: data.length })
  })

  router.get('/efficiency/community', (req, res) => {
    const t0 = Date.now()
    const startDate = (req.query.startDate as string) || '2024-01-01'
    const excludeHolidays = req.query.excludeHolidays !== 'false'

    let sql = `SELECT c.name AS community_name, count() AS total_count, countIf(cl.status = 'completed') AS completed_count, round(countIf(cl.status = 'completed') / count() * 100, 1) AS on_time_rate FROM collection_logs cl JOIN bin_points bp ON cl.bin_point_id = bp.id JOIN communities c ON bp.community_id = c.id WHERE cl.plan_time >= {startDate:DateTime}`
    const params: Record<string, any> = { startDate }

    if (excludeHolidays) {
      sql += ` AND cl.is_holiday = 0`
      params.excludeHolidays = true
    }
    sql += ` GROUP BY c.name ORDER BY on_time_rate DESC`

    let logs = db.collectionLogs.filter(l => new Date(l.plan_time).toISOString().split('T')[0] >= startDate)
    if (excludeHolidays) logs = logs.filter(l => l.is_holiday === 0)

    const commMap = new Map<string, { communityId: string; total: number; completed: number }>()
    logs.forEach(l => {
      const bin = db.binPoints.find(b => b.id === l.bin_point_id)
      if (bin) {
        const existing = commMap.get(bin.community_id) || { communityId: bin.community_id, total: 0, completed: 0 }
        existing.total++; if (l.status === 'completed') existing.completed++
        commMap.set(bin.community_id, existing)
      }
    })

    const data = Array.from(commMap.values()).map(d => {
      const comm = db.communities.find(c => c.id === d.communityId)
      return {
        communityName: comm?.name || '未知', district: comm?.district || '',
        totalCount: d.total, completedCount: d.completed,
        onTimeRate: d.total > 0 ? parseFloat((d.completed / d.total * 100).toFixed(1)) : 0
      }
    }).sort((a, b) => b.onTimeRate - a.onTimeRate)

    logQuery(sql, params, Date.now() - t0, data.length)
    res.json({ sql, params, data, rowCount: data.length })
  })

  router.get('/trend', (req, res) => {
    const t0 = Date.now()
    const startDate = (req.query.startDate as string) || '2024-01-01'
    const excludeHolidays = req.query.excludeHolidays !== 'false'

    let sql = `SELECT toDate(plan_time) AS date, count() AS total, countIf(status = 'completed') AS completed, round(countIf(status = 'completed') / count() * 100, 1) AS on_time_rate FROM collection_logs WHERE plan_time >= {startDate:DateTime}`
    const params: Record<string, any> = { startDate }

    if (excludeHolidays) {
      sql += ` AND is_holiday = 0`
      params.excludeHolidays = true
    }
    sql += ` GROUP BY date ORDER BY date`

    let logs = db.collectionLogs.filter(l => new Date(l.plan_time).toISOString().split('T')[0] >= startDate)
    if (excludeHolidays) logs = logs.filter(l => l.is_holiday === 0)

    const dateMap = new Map<string, { total: number; completed: number }>()
    logs.forEach(l => {
      const date = new Date(l.plan_time).toISOString().split('T')[0]
      const existing = dateMap.get(date) || { total: 0, completed: 0 }
      existing.total++; if (l.status === 'completed') existing.completed++
      dateMap.set(date, existing)
    })

    const data = Array.from(dateMap.entries()).map(([date, d]) => ({
      date, totalCount: d.total, completedCount: d.completed,
      onTimeRate: d.total > 0 ? parseFloat((d.completed / d.total * 100).toFixed(1)) : 0
    })).sort((a, b) => a.date.localeCompare(b.date))

    logQuery(sql, params, Date.now() - t0, data.length)
    res.json({ sql, params, data, rowCount: data.length })
  })

  return router
}
