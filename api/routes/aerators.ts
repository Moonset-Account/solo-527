import { Router, type Request, type Response } from 'express'
import { getDb } from '../database'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM aerator_status').all()
  res.json({ success: true, data: rows })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, autoMode } = req.body
  const { id } = req.params

  const existing = db.prepare('SELECT * FROM aerator_status WHERE id = ?').get(id) as any
  if (!existing) { res.status(404).json({ success: false, error: 'Aerator not found' }); return }

  const now = new Date().toISOString()
  db.prepare(`
    UPDATE aerator_status SET status = ?, last_switch_at = ?, auto_mode = ? WHERE id = ?
  `).run(status || existing.status, now, autoMode !== undefined ? (autoMode ? 1 : 0) : existing.auto_mode, id)

  const row = db.prepare('SELECT * FROM aerator_status WHERE id = ?').get(id)
  res.json({ success: true, data: row })
})

export default router
