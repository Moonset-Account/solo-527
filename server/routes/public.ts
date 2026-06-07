import { Router } from 'express'
import type { ClickHouseDB } from '../types.js'
import { logQuery } from '../types.js'

export function publicRoutes(db: ClickHouseDB) {
  const router = Router()

  router.get('/report', (_req, res) => {
    const t0 = Date.now()
    const sql = `SELECT c.district, count(DISTINCT bp.id) AS bin_count, countIf(bp.status = 'normal') AS normal_count, round(countIf(bp.status = 'normal') / count(DISTINCT bp.id) * 100, 1) AS normal_rate, round(avg(CASE WHEN mr.audit_status = 'approved' THEN mr.misuse_rate ELSE NULL END), 1) AS avg_misuse_rate, round(countIf(cl.status = 'completed' AND cl.is_holiday = 0) / NULLIF(countIf(cl.is_holiday = 0), 0) * 100, 1) AS on_time_rate FROM communities c JOIN bin_points bp ON bp.community_id = c.id LEFT JOIN misuse_records mr ON mr.bin_point_id = bp.id AND mr.audit_status = 'approved' LEFT JOIN collection_logs cl ON cl.bin_point_id = bp.id AND cl.is_holiday = 0 GROUP BY c.district ORDER BY c.district`

    const totalBins = db.binPoints.length
    const normalBins = db.binPoints.filter(b => b.status === 'normal').length
    const approvedRecords = db.misuseRecords.filter(r => r.audit_status === 'approved')
    const avgMisuseRate = approvedRecords.length > 0 ? parseFloat((approvedRecords.reduce((s, r) => s + r.misuse_rate, 0) / approvedRecords.length).toFixed(1)) : 0
    const nonHolidayLogs = db.collectionLogs.filter(l => l.is_holiday === 0)
    const onTimeRate = nonHolidayLogs.length > 0 ? parseFloat((nonHolidayLogs.filter(l => l.status === 'completed').length / nonHolidayLogs.length * 100).toFixed(1)) : 0

    const districtStats = new Map<string, { bins: number; normalBins: number }>()
    db.communities.forEach(c => {
      if (!districtStats.has(c.district)) districtStats.set(c.district, { bins: 0, normalBins: 0 })
      const bins = db.binPoints.filter(b => b.community_id === c.id)
      const stats = districtStats.get(c.district)!
      stats.bins += bins.length
      stats.normalBins += bins.filter(b => b.status === 'normal').length
    })

    const districts = Array.from(districtStats.entries()).map(([district, stats]) => {
      const binIds = new Set<string>()
      db.communities.filter(c => c.district === district).forEach(c => {
        db.binPoints.filter(b => b.community_id === c.id).forEach(b => binIds.add(b.id))
      })
      const distRecords = approvedRecords.filter(r => binIds.has(r.bin_point_id))
      const avgMisuse = distRecords.length > 0 ? parseFloat((distRecords.reduce((s, r) => s + r.misuse_rate, 0) / distRecords.length).toFixed(1)) : 0
      const distLogs = nonHolidayLogs.filter(l => binIds.has(l.bin_point_id))
      const onTime = distLogs.length > 0 ? parseFloat((distLogs.filter(l => l.status === 'completed').length / distLogs.length * 100).toFixed(1)) : 0

      return {
        district, binCount: stats.bins,
        normalRate: stats.bins > 0 ? parseFloat((stats.normalBins / stats.bins * 100).toFixed(1)) : 0,
        avgMisuseRate: avgMisuse, onTimeRate: onTime
      }
    })

    const data = {
      generatedAt: new Date().toISOString(),
      summary: { totalBins, normalRate: totalBins > 0 ? parseFloat((normalBins / totalBins * 100).toFixed(1)) : 0, avgMisuseRate, onTimeRate },
      districts,
      note: '本报表数据均已脱敏聚合处理，不含桶点定位信息、巡查照片及个人数据'
    }

    logQuery(sql, {}, Date.now() - t0, districts.length)
    res.json({ sql, params: {}, data, rowCount: districts.length })
  })

  router.get('/report/csv', (_req, res) => {
    const t0 = Date.now()
    const sql = `SELECT c.district, count(DISTINCT bp.id) AS bin_count, ... (same as /report)`

    const totalBins = db.binPoints.length
    const normalBins = db.binPoints.filter(b => b.status === 'normal').length
    const approvedRecords = db.misuseRecords.filter(r => r.audit_status === 'approved')
    const avgMisuseRate = approvedRecords.length > 0 ? parseFloat((approvedRecords.reduce((s, r) => s + r.misuse_rate, 0) / approvedRecords.length).toFixed(1)) : 0
    const nonHolidayLogs = db.collectionLogs.filter(l => l.is_holiday === 0)
    const onTimeRate = nonHolidayLogs.length > 0 ? parseFloat((nonHolidayLogs.filter(l => l.status === 'completed').length / nonHolidayLogs.length * 100).toFixed(1)) : 0

    const districtStats = new Map<string, { bins: number; normalBins: number }>()
    db.communities.forEach(c => {
      if (!districtStats.has(c.district)) districtStats.set(c.district, { bins: 0, normalBins: 0 })
      const bins = db.binPoints.filter(b => b.community_id === c.id)
      const stats = districtStats.get(c.district)!
      stats.bins += bins.length
      stats.normalBins += bins.filter(b => b.status === 'normal').length
    })

    const districts = Array.from(districtStats.entries()).map(([district, stats]) => {
      const binIds = new Set<string>()
      db.communities.filter(c => c.district === district).forEach(c => {
        db.binPoints.filter(b => b.community_id === c.id).forEach(b => binIds.add(b.id))
      })
      const distRecords = approvedRecords.filter(r => binIds.has(r.bin_point_id))
      const avgMisuse = distRecords.length > 0 ? parseFloat((distRecords.reduce((s, r) => s + r.misuse_rate, 0) / distRecords.length).toFixed(1)) : 0
      const distLogs = nonHolidayLogs.filter(l => binIds.has(l.bin_point_id))
      const onTime = distLogs.length > 0 ? parseFloat((distLogs.filter(l => l.status === 'completed').length / distLogs.length * 100).toFixed(1)) : 0
      return { district, binCount: stats.bins, normalRate: stats.bins > 0 ? parseFloat((stats.normalBins / stats.bins * 100).toFixed(1)) : 0, avgMisuseRate: avgMisuse, onTimeRate: onTime }
    })

    const headers = ['行政区', '桶点数', '正常率(%)', '平均误投率(%)', '清运准时率(%)']
    const rows = districts.map(d => [d.district, String(d.binCount), String(d.normalRate), String(d.avgMisuseRate), String(d.onTimeRate)])
    const summaryRow = ['合计', String(totalBins), String(totalBins > 0 ? ((normalBins / totalBins) * 100).toFixed(1) : '0'), String(avgMisuseRate), String(onTimeRate)]
    const lines = ['# 城市垃圾分类运营公开报表', `# 生成时间: ${new Date().toLocaleString('zh-CN')}`, '# 本报表数据均已脱敏聚合处理，不含桶点定位信息、巡查照片及个人数据', '', headers.join(','), ...rows.map(r => r.join(',')), summaryRow.join(',')]
    const csv = '\uFEFF' + lines.join('\n')

    logQuery(sql, {}, Date.now() - t0, districts.length)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="public_report_${new Date().toISOString().split('T')[0]}.csv"`)
    res.send(csv)
  })

  return router
}
