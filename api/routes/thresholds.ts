import { Router, type Request, type Response } from 'express'
import { getDb } from '../database'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, pondId } = req.query

  let sql = 'SELECT * FROM thresholds WHERE 1=1'
  const params: any[] = []

  if (pondId) { sql += ' AND pond_id = ?'; params.push(pondId) }

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM thresholds WHERE id = ?').get(req.params.id)
  if (!row) { res.status(404).json({ success: false, error: 'Threshold not found' }); return }
  res.json({ success: true, data: row })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { warningLow, warningHigh, criticalLow, criticalHigh } = req.body

  db.prepare(`
    UPDATE thresholds SET warning_low = ?, warning_high = ?, critical_low = ?, critical_high = ? WHERE id = ?
  `).run(warningLow, warningHigh, criticalLow, criticalHigh, req.params.id)

  const row = db.prepare('SELECT * FROM thresholds WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { id, metric, pondId, warningLow, warningHigh, criticalLow, criticalHigh } = req.body

  if (!metric || !pondId) {
    res.status(400).json({ success: false, error: 'metric and pondId required' })
    return
  }

  db.prepare(`
    INSERT OR REPLACE INTO thresholds (id, metric, pond_id, warning_low, warning_high, critical_low, critical_high)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id || `th-${pondId}-${metric}`, metric, pondId, warningLow, warningHigh, criticalLow, criticalHigh)

  res.json({ success: true })
})

export default router
