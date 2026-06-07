import { Router, type Request, type Response } from 'express'
import { getDb } from '../database'

const router = Router()

router.get('/export', (req: Request, res: Response): void => {
  const db = getDb()
  const { start, end, pondId, format } = req.query

  let alertSql = 'SELECT * FROM alerts WHERE 1=1'
  const params: any[] = []

  if (start) { alertSql += ' AND triggered_at >= ?'; params.push(start) }
  if (end) { alertSql += ' AND triggered_at <= ?'; params.push(end) }
  if (pondId) { alertSql += ' AND pond_id = ?'; params.push(pondId) }

  alertSql += ' ORDER BY triggered_at DESC'

  const alerts = db.prepare(alertSql).all(...params) as any[]

  if (format === 'csv') {
    const headers = 'ID,类型,严重级别,指标,塘口,数值,阈值,触发时间,状态,判定,备注\n'
    const rows = alerts.map(a =>
      `${a.id},${a.type},${a.severity},${a.metric},${a.pond_id},${a.value},${a.threshold_value},${a.triggered_at},${a.status},${a.human_judgment || ''},"${(a.judgment_note || '').replace(/"/g, '""')}"`
    ).join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename=report.csv')
    res.send('\uFEFF' + headers + rows)
    return
  }

  const total = alerts.length
  const acknowledged = alerts.filter(a => a.status !== 'pending').length
  const ackRate = total > 0 ? Math.round((acknowledged / total) * 100) : 0

  const judgmentDist: Record<string, number> = { false_alarm: 0, real_anomaly: 0, needs_onsite: 0 }
  for (const a of alerts) {
    if (a.human_judgment) {
      judgmentDist[a.human_judgment] = (judgmentDist[a.human_judgment] || 0) + 1
    }
  }

  res.json({
    success: true,
    data: {
      total,
      acknowledged,
      ackRate,
      judgmentDist,
      alerts,
    },
  })
})

export default router
