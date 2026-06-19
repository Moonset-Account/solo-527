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
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))
  const search = req.query.search as string
  const status = req.query.status as string

  let where = 'WHERE 1=1'
  const params: any[] = []

  if (search) {
    where += ' AND (m.name LIKE ? OR m.caliber LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (status) {
    where += ' AND m.status = ?'
    params.push(status)
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM metric m ${where}`).get(...params) as any).count
  const rows = db.prepare(
    `SELECT m.*, d.name as dataset_name FROM metric m LEFT JOIN dataset d ON m.dataset_id = d.id ${where} ORDER BY m.updated_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, (page - 1) * pageSize) as any[]

  res.json({
    success: true,
    data: {
      items: rows.map(r => ({
        id: r.id,
        name: r.name,
        caliber: r.caliber,
        formula: r.formula,
        datasetId: r.dataset_id,
        datasetName: r.dataset_name,
        status: r.status,
        notifyOnChange: !!r.notify_on_change,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      total,
      page,
      pageSize,
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const metric = db.prepare('SELECT m.*, d.name as dataset_name FROM metric m LEFT JOIN dataset d ON m.dataset_id = d.id WHERE m.id = ?').get(req.params.id) as any

  if (!metric) {
    res.status(404).json({ success: false, error: '指标不存在' })
    return
  }

  const dimensions = db.prepare('SELECT * FROM dimension WHERE metric_id = ?').all(req.params.id) as any[]
  const caliberChanges = db.prepare(
    'SELECT cc.*, u.display_name as changed_by_name FROM caliber_change cc LEFT JOIN user u ON cc.changed_by = u.id WHERE cc.metric_id = ? ORDER BY cc.changed_at DESC'
  ).all(req.params.id) as any[]

  res.json({
    success: true,
    data: {
      id: metric.id,
      name: metric.name,
      caliber: metric.caliber,
      formula: metric.formula,
      datasetId: metric.dataset_id,
      datasetName: metric.dataset_name,
      status: metric.status,
      notifyOnChange: !!metric.notify_on_change,
      createdAt: metric.created_at,
      updatedAt: metric.updated_at,
      dimensions: dimensions.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        values: d.values,
      })),
      caliberChanges: caliberChanges.map(c => ({
        id: c.id,
        oldCaliber: c.old_caliber,
        newCaliber: c.new_caliber,
        changedBy: c.changed_by,
        changedByName: c.changed_by_name,
        changedAt: c.changed_at,
        securityNote: c.security_note,
      })),
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const { name, caliber, formula, datasetId, notifyOnChange, dimensions } = req.body
  if (!name || !caliber || !datasetId) {
    res.status(400).json({ success: false, error: '指标名称、口径和数据集不能为空' })
    return
  }

  const insertMetric = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO metric (name, caliber, formula, dataset_id, notify_on_change) VALUES (?, ?, ?, ?, ?)'
    ).run(name, caliber, formula || null, datasetId, notifyOnChange ? 1 : 0)

    const metricId = result.lastInsertRowid as number

    if (Array.isArray(dimensions)) {
      const insertDim = db.prepare(
        'INSERT INTO dimension (metric_id, name, type, "values") VALUES (?, ?, ?, ?)'
      )
      for (const dim of dimensions) {
        insertDim.run(metricId, dim.name, dim.type || 'enum', dim.values || null)
      }
    }

    return metricId
  })

  const metricId = insertMetric()
  const metric = db.prepare('SELECT * FROM metric WHERE id = ?').get(metricId)

  res.status(201).json({ success: true, data: metric })
})

router.put('/:id', (req: Request, res: Response): void => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const metric = db.prepare('SELECT * FROM metric WHERE id = ?').get(req.params.id) as any
  if (!metric) {
    res.status(404).json({ success: false, error: '指标不存在' })
    return
  }

  const { name, caliber, formula, datasetId, status, notifyOnChange, securityNote, dimensions } = req.body
  const caliberChanged = caliber && caliber !== metric.caliber

  const updateMetric = db.transaction(() => {
    if (caliberChanged) {
      db.prepare(
        'INSERT INTO caliber_change (metric_id, old_caliber, new_caliber, changed_by, security_note) VALUES (?, ?, ?, ?, ?)'
      ).run(Number(req.params.id), metric.caliber, caliber, userId, securityNote || null)
    }

    db.prepare(
      'UPDATE metric SET name = ?, caliber = ?, formula = ?, dataset_id = ?, status = ?, notify_on_change = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(
      name ?? metric.name,
      caliber ?? metric.caliber,
      formula ?? metric.formula,
      datasetId ?? metric.dataset_id,
      status ?? metric.status,
      notifyOnChange !== undefined ? (notifyOnChange ? 1 : 0) : metric.notify_on_change,
      req.params.id,
    )

    const snapshotData = JSON.stringify({
      name: name ?? metric.name,
      caliber: caliber ?? metric.caliber,
      formula: formula ?? metric.formula,
      datasetId: datasetId ?? metric.dataset_id,
      status: status ?? metric.status,
      notifyOnChange: notifyOnChange !== undefined ? notifyOnChange : !!metric.notify_on_change,
    })
    db.prepare(
      'INSERT INTO version_snapshot (entity_type, entity_id, version, snapshot, changed_by, change_description) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      'caliber',
      Number(req.params.id),
      metric.version + 1,
      snapshotData,
      userId,
      caliberChanged ? '口径变更' : '指标更新',
    )

    if (caliberChanged && metric.notify_on_change) {
      const subs = db.prepare('SELECT * FROM subscription WHERE metric_id = ? AND is_active = 1').all(req.params.id) as any[]
      for (const sub of subs) {
        const deviation = Math.random() * 30 + 10
        db.prepare(
          'INSERT INTO anomaly_event (metric_id, actual_value, expected_value, deviation, severity, root_cause, is_caliber_related, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          Number(req.params.id),
          0,
          0,
          deviation,
          deviation > 25 ? 'high' : 'medium',
          '口径变更导致的异常',
          1,
          'new',
        )
      }
    }

    if (Array.isArray(dimensions)) {
      db.prepare('DELETE FROM dimension WHERE metric_id = ?').run(req.params.id)
      const insertDim = db.prepare(
        'INSERT INTO dimension (metric_id, name, type, "values") VALUES (?, ?, ?, ?)'
      )
      for (const dim of dimensions) {
        insertDim.run(Number(req.params.id), dim.name, dim.type || 'enum', dim.values || null)
      }
    }
  })

  updateMetric()
  const updated = db.prepare('SELECT * FROM metric WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const metric = db.prepare('SELECT * FROM metric WHERE id = ?').get(req.params.id) as any
  if (!metric) {
    res.status(404).json({ success: false, error: '指标不存在' })
    return
  }

  db.prepare("UPDATE metric SET status = 'deprecated', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id)
  res.json({ success: true, data: { id: Number(req.params.id), status: 'deprecated' } })
})

export default router
