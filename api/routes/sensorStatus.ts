import { Router, type Request, type Response } from 'express'
import { getDb } from '../database'

const router = Router()

router.get('/status', (req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM sensor_status').all()
  res.json({ success: true, data: rows })
})

router.put('/status/:sensorId', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, lastHeartbeat, lastReading } = req.body
  const { sensorId } = req.params

  const existing = db.prepare('SELECT * FROM sensor_status WHERE sensor_id = ?').get(sensorId) as any
  if (!existing) { res.status(404).json({ success: false, error: 'Sensor not found' }); return }

  db.prepare(`
    UPDATE sensor_status SET status = ?, last_heartbeat = ?, last_reading = ? WHERE sensor_id = ?
  `).run(status || existing.status, lastHeartbeat || existing.last_heartbeat, lastReading ?? existing.last_reading, sensorId)

  res.json({ success: true })
})

export default router
