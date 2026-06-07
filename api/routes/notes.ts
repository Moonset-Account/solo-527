import { Router, type Request, type Response } from 'express'
import { getDb } from '../database'

function uuid(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { alertId, readingId } = req.query

  let sql = 'SELECT * FROM processing_notes WHERE 1=1'
  const params: any[] = []

  if (alertId) { sql += ' AND alert_id = ?'; params.push(alertId) }
  if (readingId) { sql += ' AND reading_id = ?'; params.push(readingId) }

  sql += ' ORDER BY created_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { alertId, readingId, note, createdBy } = req.body

  if (!note) {
    res.status(400).json({ success: false, error: 'note is required' })
    return
  }

  const id = uuid()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO processing_notes (id, alert_id, reading_id, note, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, alertId || null, readingId || null, note, createdBy || '当前用户', now)

  const row = db.prepare('SELECT * FROM processing_notes WHERE id = ?').get(id)
  res.json({ success: true, data: row })
})

router.get('/reading/:readingId', (req: Request, res: Response): void => {
  const db = getDb()
  const { readingId } = req.params

  const reading = db.prepare('SELECT * FROM sensor_readings WHERE id = ?').get(readingId) as any
  if (!reading) { res.status(404).json({ success: false, error: 'Reading not found' }); return }

  const notes = db.prepare('SELECT * FROM processing_notes WHERE reading_id = ?').all(readingId)

  const alerts = db.prepare(
    'SELECT * FROM alerts WHERE pond_id = ? AND metric = ? ORDER BY triggered_at DESC'
  ).all(reading.pond_id, reading.metric)

  const alertNotes = db.prepare(`
    SELECT pn.* FROM processing_notes pn
    INNER JOIN alerts a ON pn.alert_id = a.id
    WHERE a.pond_id = ? AND a.metric = ?
    ORDER BY pn.created_at DESC
  `).all(reading.pond_id, reading.metric)

  const allNotes = [...notes, ...alertNotes].filter((n: any, i: number, arr: any[]) =>
    arr.findIndex((x: any) => x.id === n.id) === i
  )

  res.json({
    success: true,
    data: {
      reading,
      notes: allNotes,
      alerts,
    },
  })
})

export default router
