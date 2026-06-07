import { Router, type Request, type Response } from 'express'
import { getDb } from '../database'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status } = req.query

  let sql = 'SELECT * FROM pond_batches WHERE 1=1'
  const params: any[] = []

  if (status) { sql += ' AND status = ?'; params.push(status) }

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM pond_batches WHERE id = ?').get(req.params.id)
  if (!row) { res.status(404).json({ success: false, error: 'Batch not found' }); return }
  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { id, pondId, batchName, species, startDate, endDate, status } = req.body

  if (!pondId || !batchName || !startDate) {
    res.status(400).json({ success: false, error: 'pondId, batchName, startDate required' })
    return
  }

  const batchId = id || 'batch-' + Math.random().toString(36).substring(2, 10)

  db.prepare(`
    INSERT INTO pond_batches (id, pond_id, batch_name, species, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(batchId, pondId, batchName, species || null, startDate, endDate || null, status || 'active')

  const row = db.prepare('SELECT * FROM pond_batches WHERE id = ?').get(batchId)
  res.json({ success: true, data: row })
})

export default router
