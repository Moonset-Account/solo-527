import { Router, type Request, type Response } from 'express'
import { getDb } from '../database'
import { checkThresholds } from '../thresholdEngine'

function uuid(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

const router = Router()

router.get('/readings', (req: Request, res: Response): void => {
  const db = getDb()
  const { pondId, metric, start, end, limit } = req.query

  let sql = 'SELECT * FROM sensor_readings WHERE 1=1'
  const params: any[] = []

  if (pondId) { sql += ' AND pond_id = ?'; params.push(pondId) }
  if (metric) { sql += ' AND metric = ?'; params.push(metric) }
  if (start) { sql += ' AND ts >= ?'; params.push(start) }
  if (end) { sql += ' AND ts <= ?'; params.push(end) }

  sql += ' ORDER BY ts ASC'

  if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)) }

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/readings/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM sensor_readings WHERE id = ?').get(req.params.id)
  if (!row) { res.status(404).json({ success: false, error: 'Reading not found' }); return }
  res.json({ success: true, data: row })
})

router.post('/readings', (req: Request, res: Response): void => {
  const db = getDb()
  const { sensorId, pondId, metric, value, quality } = req.body

  if (!sensorId || !pondId || !metric) {
    res.status(400).json({ success: false, error: 'sensorId, pondId, metric required' })
    return
  }

  const id = uuid()
  const ts = new Date().toISOString()
  const isAnomaly = req.body.isAnomaly ? 1 : 0
  const q = quality || 'good'

  db.prepare(`
    INSERT INTO sensor_readings (id, sensor_id, pond_id, metric, value, ts, is_anomaly, quality)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, sensorId, pondId, metric, value ?? null, ts, isAnomaly, q)

  db.prepare(`
    UPDATE sensor_status SET status = ?, last_heartbeat = ?, last_reading = ? WHERE sensor_id = ?
  `).run(q === 'offline' ? 'offline' : 'online', ts, value ?? null, sensorId)

  if (value != null && q !== 'offline') {
    checkThresholds(pondId, metric, value)
  }

  res.json({ success: true, data: { id, sensorId, pondId, metric, value, ts, isAnomaly: !!isAnomaly, quality: q } })
})

export default router
