import { Router } from 'express'
import { executeQuery, getFallbackDbSync } from '../clickhouse.js'
import { logQuery } from '../types.js'

export function misuseRoutes() {
  const router = Router()

  router.get('/trend', async (req, res) => {
    const t0 = Date.now()
    const startDate = (req.query.startDate as string) || '2024-01-01'
    const constEndDate = (req.query.endDate as string) || new Date().toISOString().split('T')[0]
    const communityId = req.query.communityId as string
    const misuseType = req.query.misuseType as string

    let sql = `SELECT record_date, misuse_type, count() AS record_count, avg(misuse_rate) AS avg_misuse_rate FROM misuse_records WHERE audit_status = 'approved' AND record_date >= {startDate:Date} AND record_date <= {endDate:Date}`
    const params: Record<string, any> = { startDate, endDate: constEndDate }

    if (communityId && communityId !== 'all') {
      sql += ` AND bin_point_id IN (SELECT id FROM bin_points WHERE community_id = {communityId:String})`
      params.communityId = communityId
    }
    if (misuseType && misuseType !== 'all') {
      sql += ` AND misuse_type = {misuseType:String}`
      params.misuseType = misuseType
    }
    sql += ` GROUP BY record_date, misuse_type ORDER BY record_date, misuse_type`

    const result = await executeQuery(sql, params, () => {
      const db = getFallbackDbSync()
      let binIds: Set<string> | null = null
      if (communityId && communityId !== 'all') {
        binIds = new Set(db.binPoints.filter(b => b.community_id === communityId).map(b => b.id))
      }

      let records = db.misuseRecords.filter(r => r.audit_status === 'approved' && r.record_date >= startDate && r.record_date <= constEndDate)
      if (binIds) records = records.filter(r => binIds!.has(r.bin_point_id))
      if (misuseType && misuseType !== 'all') records = records.filter(r => r.misuse_type === misuseType)

      const trendMap = new Map<string, { date: string; type: string; count: number; sumRate: number }>()
      records.forEach(r => {
        const key = `${r.record_date}|${r.misuse_type}`
        const existing = trendMap.get(key)
        if (existing) { existing.count++; existing.sumRate += r.misuse_rate } else { trendMap.set(key, { date: r.record_date, type: r.misuse_type, count: 1, sumRate: r.misuse_rate }) }
      })

      return Array.from(trendMap.values()).map(t => ({
        date: t.date, misuseType: t.type, recordCount: t.count,
        avgMisuseRate: parseFloat((t.sumRate / t.count).toFixed(1))
      })).sort((a, b) => a.date.localeCompare(b.date))
    })

    logQuery(sql, params, Date.now() - t0, result.data.length)
    res.json({ sql, params, data: result.data, rowCount: result.data.length, fromClickHouse: result.fromClickHouse })
  })

  router.get('/by-type', async (req, res) => {
    const t0 = Date.now()
    const startDate = (req.query.startDate as string) || '2024-01-01'
    const communityId = req.query.communityId as string

    let sql = `SELECT misuse_type, count() AS record_count, avg(misuse_rate) AS avg_misuse_rate FROM misuse_records WHERE audit_status = 'approved' AND record_date >= {startDate:Date}`
    const params: Record<string, any> = { startDate }

    if (communityId && communityId !== 'all') {
      sql += ` AND bin_point_id IN (SELECT id FROM bin_points WHERE community_id = {communityId:String})`
      params.communityId = communityId
    }
    sql += ` GROUP BY misuse_type ORDER BY avg_misuse_rate DESC`

    const result = await executeQuery(sql, params, () => {
      const db = getFallbackDbSync()
      let binIds: Set<string> | null = null
      if (communityId && communityId !== 'all') {
        binIds = new Set(db.binPoints.filter(b => b.community_id === communityId).map(b => b.id))
      }

      let records = db.misuseRecords.filter(r => r.audit_status === 'approved' && r.record_date >= startDate)
      if (binIds) records = records.filter(r => binIds!.has(r.bin_point_id))

      const typeMap = new Map<string, { count: number; sumRate: number }>()
      records.forEach(r => {
        const existing = typeMap.get(r.misuse_type) || { count: 0, sumRate: 0 }
        existing.count++; existing.sumRate += r.misuse_rate
        typeMap.set(r.misuse_type, existing)
      })

      return Array.from(typeMap.entries()).map(([type, d]) => ({
        misuseType: type, recordCount: d.count,
        avgMisuseRate: parseFloat((d.sumRate / d.count).toFixed(1))
      })).sort((a, b) => b.avgMisuseRate - a.avgMisuseRate)
    })

    logQuery(sql, params, Date.now() - t0, result.data.length)
    res.json({ sql, params, data: result.data, rowCount: result.data.length, fromClickHouse: result.fromClickHouse })
  })

  return router
}
