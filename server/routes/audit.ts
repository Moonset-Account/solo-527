import { Router } from 'express'
import type { ClickHouseDB } from '../types.js'
import { logQuery } from '../types.js'

export function auditRoutes(db: ClickHouseDB) {
  const router = Router()

  router.get('/reject-logs', (req, res) => {
    const t0 = Date.now()
    const limit = parseInt(req.query.limit as string) || 50

    const sql = `SELECT al.id, al.photo_id, al.auditor, al.audit_time, al.result, al.reject_reason, ip.bin_point_id, ip.uploader, ip.upload_time FROM audit_logs al JOIN inspection_photos ip ON al.photo_id = ip.id WHERE al.result = 'rejected' ORDER BY al.audit_time DESC LIMIT {limit:UInt32}`
    const params = { limit }

    const data = db.auditLogs
      .filter(l => l.result === 'rejected')
      .map(l => {
        const photo = db.inspectionPhotos.find(p => p.id === l.photo_id)
        const bin = photo ? db.binPoints.find(b => b.id === photo.bin_point_id) : undefined
        const comm = bin ? db.communities.find(c => c.id === bin.community_id) : undefined
        return {
          id: l.id, photoId: l.photo_id, auditor: l.auditor, auditTime: l.audit_time,
          result: l.result, rejectReason: l.reject_reason || '未填写',
          binPointId: photo?.bin_point_id || '', binName: bin?.name || '未知',
          communityName: comm?.name || '未知', uploader: photo?.uploader || ''
        }
      })
      .sort((a, b) => new Date(b.auditTime).getTime() - new Date(a.auditTime).getTime())
      .slice(0, limit)

    logQuery(sql, params, Date.now() - t0, data.length)
    res.json({ sql, params, data, rowCount: data.length })
  })

  router.get('/community-ranking', (req, res) => {
    const t0 = Date.now()
    const excludeHolidays = req.query.excludeHolidays !== 'false'

    let sql = `SELECT c.name AS community_name, c.district, count(DISTINCT bp.id) AS bin_count, round(avg(CASE WHEN mr.audit_status = 'approved' THEN mr.misuse_rate ELSE NULL END), 1) AS avg_misuse_rate, round(countIf(cl.status = 'completed' AND cl.is_holiday = 0) / NULLIF(countIf(cl.is_holiday = 0), 0) * 100, 1) AS on_time_rate FROM communities c JOIN bin_points bp ON bp.community_id = c.id LEFT JOIN misuse_records mr ON mr.bin_point_id = bp.id AND mr.audit_status = 'approved'`
    const params: Record<string, any> = {}

    if (excludeHolidays) {
      sql += ` LEFT JOIN collection_logs cl ON cl.bin_point_id = bp.id AND cl.is_holiday = 0`
      params.excludeHolidays = true
    } else {
      sql += ` LEFT JOIN collection_logs cl ON cl.bin_point_id = bp.id`
    }
    sql += ` GROUP BY c.name, c.district ORDER BY avg_misuse_rate DESC`

    const data = db.communities.map(comm => {
      const binIds = new Set(db.binPoints.filter(b => b.community_id === comm.id).map(b => b.id))
      const approvedRecords = db.misuseRecords.filter(r => r.audit_status === 'approved' && binIds.has(r.bin_point_id))
      const avgMisuse = approvedRecords.length > 0 ? parseFloat((approvedRecords.reduce((s, r) => s + r.misuse_rate, 0) / approvedRecords.length).toFixed(1)) : 0
      let logs = db.collectionLogs.filter(l => binIds.has(l.bin_point_id))
      if (excludeHolidays) logs = logs.filter(l => l.is_holiday === 0)
      const onTime = logs.length > 0 ? parseFloat((logs.filter(l => l.status === 'completed').length / logs.length * 100).toFixed(1)) : 0
      const photos = db.inspectionPhotos.filter(p => binIds.has(p.bin_point_id))
      const inspectionRate = binIds.size > 0 ? parseFloat((new Set(photos.map(p => p.bin_point_id)).size / binIds.size * 100).toFixed(1)) : 0
      const alerts = db.fullAlerts.filter(a => binIds.has(a.bin_point_id))
      return {
        communityId: comm.id, communityName: comm.name, district: comm.district,
        binCount: binIds.size, avgMisuseRate: avgMisuse, onTimeRate: onTime,
        inspectionRate, pendingAlertCount: alerts.filter(a => a.status !== 'resolved').length
      }
    }).sort((a, b) => b.avgMisuseRate - a.avgMisuseRate)

    logQuery(sql, params, Date.now() - t0, data.length)
    res.json({ sql, params, data, rowCount: data.length })
  })

  router.get('/photos', (req, res) => {
    const t0 = Date.now()
    const status = req.query.status as string
    const communityId = req.query.communityId as string

    let sql = `SELECT ip.*, bp.name AS bin_name, c.name AS community_name FROM inspection_photos ip JOIN bin_points bp ON ip.bin_point_id = bp.id JOIN communities c ON bp.community_id = c.id WHERE 1=1`
    const params: Record<string, any> = {}

    if (status) { sql += ` AND ip.audit_status = {status:String}`; params.status = status }
    if (communityId && communityId !== 'all') { sql += ` AND bp.community_id = {communityId:String}`; params.communityId = communityId }
    sql += ` ORDER BY ip.upload_time DESC`

    let photos = db.inspectionPhotos
    if (status) photos = photos.filter(p => p.audit_status === status)
    if (communityId && communityId !== 'all') {
      const binIds = new Set(db.binPoints.filter(b => b.community_id === communityId).map(b => b.id))
      photos = photos.filter(p => binIds.has(p.bin_point_id))
    }

    const data = photos.map(p => {
      const bin = db.binPoints.find(b => b.id === p.bin_point_id)
      const comm = bin ? db.communities.find(c => c.id === bin.community_id) : undefined
      const auditLog = db.auditLogs.find(l => l.photo_id === p.id)
      return {
        id: p.id, binPointId: p.bin_point_id, uploader: p.uploader,
        uploadTime: p.upload_time, photoUrl: p.photo_url, auditStatus: p.audit_status,
        binName: bin?.name || '未知', communityName: comm?.name || '未知',
        rejectReason: auditLog?.reject_reason || null, auditor: auditLog?.auditor || null
      }
    }).sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime())

    logQuery(sql, params, Date.now() - t0, data.length)
    res.json({ sql, params, data, rowCount: data.length })
  })

  router.get('/pending-alerts', (_req, res) => {
    const t0 = Date.now()
    const sql = `SELECT fa.id, fa.bin_point_id, fa.alert_time, fa.level, fa.status, bp.name AS bin_name, c.name AS community_name FROM full_alerts fa JOIN bin_points bp ON fa.bin_point_id = bp.id JOIN communities c ON bp.community_id = c.id WHERE fa.status != 'resolved' ORDER BY CASE fa.level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, fa.alert_time DESC`

    const data = db.fullAlerts.filter(a => a.status !== 'resolved').map(a => {
      const bin = db.binPoints.find(b => b.id === a.bin_point_id)
      const comm = bin ? db.communities.find(c => c.id === bin.community_id) : undefined
      return {
        id: a.id, binPointId: a.bin_point_id, binName: bin?.name || '未知',
        communityName: comm?.name || '未知', alertTime: a.alert_time,
        level: a.level, status: a.status, handler: a.handler
      }
    }).sort((a, b) => {
      const lo: Record<string, number> = { high: 0, medium: 1, low: 2 }
      const diff = (lo[a.level] ?? 2) - (lo[b.level] ?? 2)
      return diff !== 0 ? diff : new Date(b.alertTime).getTime() - new Date(a.alertTime).getTime()
    })

    logQuery(sql, {}, Date.now() - t0, data.length)
    res.json({ sql, params: {}, data, rowCount: data.length })
  })

  return router
}
