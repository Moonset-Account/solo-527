import { Router, type Request, type Response } from 'express'
import { getDb } from '../database'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { pondId } = req.query

  let sql = 'SELECT * FROM feeding_records WHERE 1=1'
  const params: any[] = []

  if (pondId) { sql += ' AND pond_id = ?'; params.push(pondId) }

  sql += ' ORDER BY ts DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { pondId, batchId, amount, feedType, strategyChange, strategyNote, ts } = req.body

  if (!pondId || !batchId || amount == null) {
    res.status(400).json({ success: false, error: 'pondId, batchId, amount required' })
    return
  }

  const id = 'feed-' + Math.random().toString(36).substring(2, 10)
  const timestamp = ts || new Date().toISOString()

  db.prepare(`
    INSERT INTO feeding_records (id, pond_id, batch_id, amount, feed_type, ts, strategy_change, strategy_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, pondId, batchId, amount, feedType || null, timestamp, strategyChange ? 1 : 0, strategyNote || null)

  const row = db.prepare('SELECT * FROM feeding_records WHERE id = ?').get(id)
  res.json({ success: true, data: row })
})

export default router
