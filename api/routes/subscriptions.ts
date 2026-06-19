import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function getUserId(req: Request): number | null {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  try {
    return Number(Buffer.from(authHeader, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}

router.get('/', (req: Request, res: Response): void => {
  const userId = getUserId(req)

  let where = 'WHERE 1=1'
  const params: any[] = []

  if (userId) {
    where += ' AND s.user_id = ?'
    params.push(userId)
  }

  const rows = db.prepare(
    `SELECT s.*, m.name as metric_name, u.display_name as user_name
     FROM subscription s
     LEFT JOIN metric m ON s.metric_id = m.id
     LEFT JOIN user u ON s.user_id = u.id
     ${where} ORDER BY s.created_at DESC`
  ).all(...params) as any[]

  res.json({
    success: true,
    data: rows.map(r => ({
      id: r.id,
      metricId: r.metric_id,
      metricName: r.metric_name,
      userId: r.user_id,
      userName: r.user_name,
      conditionType: r.condition_type,
      conditionValue: r.condition_value,
      direction: r.direction,
      notifyChannels: r.notify_channels,
      isActive: !!r.is_active,
      createdAt: r.created_at,
    })),
  })
})

router.post('/', (req: Request, res: Response): void => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const { metricId, conditionType, conditionValue, direction, notifyChannels } = req.body
  if (!metricId || conditionValue === undefined) {
    res.status(400).json({ success: false, error: '指标ID和条件值不能为空' })
    return
  }

  const result = db.prepare(
    'INSERT INTO subscription (metric_id, user_id, condition_type, condition_value, direction, notify_channels) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(metricId, userId, conditionType || 'threshold', conditionValue, direction || 'both', notifyChannels || 'in_app')

  const sub = db.prepare('SELECT * FROM subscription WHERE id = ?').get(result.lastInsertRowid)

  const snapshotData = JSON.stringify({
    metricId,
    userId,
    conditionType: conditionType || 'threshold',
    conditionValue,
    direction: direction || 'both',
    notifyChannels: notifyChannels || 'in_app',
  })
  db.prepare(
    'INSERT INTO version_snapshot (entity_type, entity_id, version, snapshot, changed_by, change_description) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('subscription', Number(result.lastInsertRowid), 1, snapshotData, userId, '创建订阅')

  res.status(201).json({ success: true, data: sub })
})

router.put('/:id', (req: Request, res: Response): void => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const sub = db.prepare('SELECT * FROM subscription WHERE id = ?').get(req.params.id) as any
  if (!sub) {
    res.status(404).json({ success: false, error: '订阅不存在' })
    return
  }

  const { conditionType, conditionValue, direction, notifyChannels, isActive } = req.body

  db.prepare(
    'UPDATE subscription SET condition_type = ?, condition_value = ?, direction = ?, notify_channels = ?, is_active = ? WHERE id = ?'
  ).run(
    conditionType ?? sub.condition_type,
    conditionValue ?? sub.condition_value,
    direction ?? sub.direction,
    notifyChannels ?? sub.notify_channels,
    isActive !== undefined ? (isActive ? 1 : 0) : sub.is_active,
    req.params.id,
  )

  const snapshotData = JSON.stringify({
    conditionType: conditionType ?? sub.condition_type,
    conditionValue: conditionValue ?? sub.condition_value,
    direction: direction ?? sub.direction,
    notifyChannels: notifyChannels ?? sub.notify_channels,
    isActive: isActive !== undefined ? isActive : !!sub.is_active,
  })
  db.prepare(
    'INSERT INTO version_snapshot (entity_type, entity_id, version, snapshot, changed_by, change_description) VALUES (?, ?, ?, ?, ?, ?)'
  ).run('subscription', Number(req.params.id), sub.version + 1, snapshotData, userId, '更新订阅')

  const updated = db.prepare('SELECT * FROM subscription WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const sub = db.prepare('SELECT * FROM subscription WHERE id = ?').get(req.params.id) as any
  if (!sub) {
    res.status(404).json({ success: false, error: '订阅不存在' })
    return
  }

  db.prepare('UPDATE subscription SET is_active = 0 WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: { id: Number(req.params.id), isActive: false } })
})

router.get('/events', (req: Request, res: Response): void => {
  const status = req.query.status as string

  let where = 'WHERE 1=1'
  const params: any[] = []

  if (status) {
    where += ' AND ae.status = ?'
    params.push(status)
  }

  const rows = db.prepare(
    `SELECT ae.*, m.name as metric_name
     FROM anomaly_event ae
     LEFT JOIN metric m ON ae.metric_id = m.id
     ${where} ORDER BY ae.detected_at DESC`
  ).all(...params) as any[]

  res.json({
    success: true,
    data: rows.map(r => ({
      id: r.id,
      metricId: r.metric_id,
      metricName: r.metric_name,
      detectedAt: r.detected_at,
      actualValue: r.actual_value,
      expectedValue: r.expected_value,
      deviation: r.deviation,
      severity: r.severity,
      isCaliberRelated: !!r.is_caliber_related,
      status: r.status,
    })),
  })
})

router.get('/events/:id', (req: Request, res: Response): void => {
  const event = db.prepare(
    `SELECT ae.*, m.name as metric_name
     FROM anomaly_event ae
     LEFT JOIN metric m ON ae.metric_id = m.id
     WHERE ae.id = ?`
  ).get(req.params.id) as any

  if (!event) {
    res.status(404).json({ success: false, error: '异常事件不存在' })
    return
  }

  res.json({
    success: true,
    data: {
      id: event.id,
      metricId: event.metric_id,
      metricName: event.metric_name,
      detectedAt: event.detected_at,
      actualValue: event.actual_value,
      expectedValue: event.expected_value,
      deviation: event.deviation,
      severity: event.severity,
      rootCause: event.root_cause,
      isCaliberRelated: !!event.is_caliber_related,
      status: event.status,
    },
  })
})

router.put('/events/:id/acknowledge', (req: Request, res: Response): void => {
  const event = db.prepare('SELECT * FROM anomaly_event WHERE id = ?').get(req.params.id) as any
  if (!event) {
    res.status(404).json({ success: false, error: '异常事件不存在' })
    return
  }

  db.prepare("UPDATE anomaly_event SET status = 'acknowledged' WHERE id = ?").run(req.params.id)
  res.json({ success: true, data: { id: Number(req.params.id), status: 'acknowledged' } })
})

export default router
