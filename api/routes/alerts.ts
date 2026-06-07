import { Router, type Request, type Response } from 'express'
import { getDb } from '../database'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, pondId, severity } = req.query

  let sql = 'SELECT * FROM alerts WHERE 1=1'
  const params: any[] = []

  if (status) { sql += ' AND status = ?'; params.push(status) }
  if (pondId) { sql += ' AND pond_id = ?'; params.push(pondId) }
  if (severity) { sql += ' AND severity = ?'; params.push(severity) }

  sql += ' ORDER BY triggered_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/stats', (req: Request, res: Response): void => {
  const db = getDb()
  const { start, end, pondId } = req.query

  let baseSql = 'SELECT * FROM alerts WHERE 1=1'
  const params: any[] = []

  if (start) { baseSql += ' AND triggered_at >= ?'; params.push(start) }
  if (end) { baseSql += ' AND triggered_at <= ?'; params.push(end) }
  if (pondId) { baseSql += ' AND pond_id = ?'; params.push(pondId) }

  const all = db.prepare(baseSql).all(...params) as any[]

  const total = all.length
  const acknowledged = all.filter(a => a.status !== 'pending').length
  const ackRate = total > 0 ? Math.round((acknowledged / total) * 100) : 0

  const judgmentDist: Record<string, number> = { false_alarm: 0, real_anomaly: 0, needs_onsite: 0 }
  for (const a of all) {
    if (a.human_judgment) {
      judgmentDist[a.human_judgment] = (judgmentDist[a.human_judgment] || 0) + 1
    }
  }

  res.json({ success: true, data: { total, acknowledged, ackRate, judgmentDist } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id)
  if (!row) { res.status(404).json({ success: false, error: 'Alert not found' }); return }
  res.json({ success: true, data: row })
})

router.post('/:id/acknowledge', (req: Request, res: Response): void => {
  const db = getDb()
  const { judgment, note, acknowledgedBy } = req.body
  const { id } = req.params

  if (!judgment) {
    res.status(400).json({ success: false, error: 'judgment is required' })
    return
  }

  const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as any
  if (!existing) { res.status(404).json({ success: false, error: 'Alert not found' }); return }

  const now = new Date().toISOString()
  db.prepare(`
    UPDATE alerts SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ?, human_judgment = ?, judgment_note = ? WHERE id = ?
  `).run(acknowledgedBy || '当前用户', now, judgment, note || null, id)

  if (note) {
    const noteId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    db.prepare(`
      INSERT INTO processing_notes (id, alert_id, reading_id, note, created_by, created_at)
      VALUES (?, ?, null, ?, ?, ?)
    `).run(noteId, id, note, acknowledgedBy || '当前用户', now)
  }

  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id)
  res.json({ success: true, data: updated })
})

export default router
