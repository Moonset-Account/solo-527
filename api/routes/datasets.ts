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
    where += ' AND (d.name LIKE ? OR d.description LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (status) {
    where += ' AND d.status = ?'
    params.push(status)
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM dataset d ${where}`).get(...params) as any).count
  const rows = db.prepare(
    `SELECT d.*, u.display_name as created_by_name FROM dataset d LEFT JOIN user u ON d.created_by = u.id ${where} ORDER BY d.updated_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, (page - 1) * pageSize) as any[]

  res.json({
    success: true,
    data: {
      items: rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        source: r.source,
        status: r.status,
        version: r.version,
        createdBy: r.created_by,
        createdByName: r.created_by_name,
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
  const dataset = db.prepare('SELECT d.*, u.display_name as created_by_name FROM dataset d LEFT JOIN user u ON d.created_by = u.id WHERE d.id = ?').get(req.params.id) as any

  if (!dataset) {
    res.status(404).json({ success: false, error: '数据集不存在' })
    return
  }

  const fields = db.prepare('SELECT * FROM dataset_field WHERE dataset_id = ?').all(req.params.id) as any[]
  const fieldIds = fields.map(f => f.id)
  const rules = fieldIds.length
    ? db.prepare(`SELECT * FROM desensitization_rule WHERE field_id IN (${fieldIds.map(() => '?').join(',')})`).all(...fieldIds) as any[]
    : []

  const rulesByField = new Map<number, any[]>()
  for (const rule of rules) {
    if (!rulesByField.has(rule.field_id)) rulesByField.set(rule.field_id, [])
    rulesByField.get(rule.field_id)!.push({
      id: rule.id,
      type: rule.type,
      params: rule.params,
      version: rule.version,
      updatedAt: rule.updated_at,
    })
  }

  res.json({
    success: true,
    data: {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
      source: dataset.source,
      status: dataset.status,
      version: dataset.version,
      createdBy: dataset.created_by,
      createdByName: dataset.created_by_name,
      createdAt: dataset.created_at,
      updatedAt: dataset.updated_at,
      fields: fields.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        isDesensitized: !!f.is_desensitized,
        desensitizationType: f.desensitization_type,
        description: f.description,
        desensitizationRules: rulesByField.get(f.id) || [],
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

  const { name, description, source, fields } = req.body
  if (!name) {
    res.status(400).json({ success: false, error: '数据集名称不能为空' })
    return
  }

  const insertDs = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO dataset (name, description, source, created_by) VALUES (?, ?, ?, ?)'
    ).run(name, description || null, source || null, userId)

    const datasetId = result.lastInsertRowid as number

    if (Array.isArray(fields)) {
      const insertField = db.prepare(
        'INSERT INTO dataset_field (dataset_id, name, type, is_desensitized, desensitization_type, description) VALUES (?, ?, ?, ?, ?, ?)'
      )
      const insertRule = db.prepare(
        'INSERT INTO desensitization_rule (field_id, type, params, version) VALUES (?, ?, ?, ?)'
      )

      for (const field of fields) {
        const fieldResult = insertField.run(
          datasetId,
          field.name,
          field.type || 'string',
          field.isDesensitized ? 1 : 0,
          field.desensitizationType || null,
          field.description || null,
        )
        if (field.isDesensitized && field.desensitizationRules?.length) {
          for (const rule of field.desensitizationRules) {
            insertRule.run(fieldResult.lastInsertRowid, rule.type, rule.params || null, 1)
          }
        }
      }
    }

    return datasetId
  })

  const datasetId = insertDs()
  const dataset = db.prepare('SELECT * FROM dataset WHERE id = ?').get(datasetId)

  res.status(201).json({ success: true, data: dataset })
})

router.put('/:id', (req: Request, res: Response): void => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const dataset = db.prepare('SELECT * FROM dataset WHERE id = ?').get(req.params.id) as any
  if (!dataset) {
    res.status(404).json({ success: false, error: '数据集不存在' })
    return
  }

  const { name, description, source, status, fields } = req.body

  const updateDs = db.transaction(() => {
    const newVersion = dataset.version + 1
    db.prepare(
      'UPDATE dataset SET name = ?, description = ?, source = ?, status = ?, version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(
      name ?? dataset.name,
      description ?? dataset.description,
      source ?? dataset.source,
      status ?? dataset.status,
      newVersion,
      req.params.id,
    )

    const snapshotData = JSON.stringify({
      name: name ?? dataset.name,
      description: description ?? dataset.description,
      source: source ?? dataset.source,
      status: status ?? dataset.status,
      version: newVersion,
    })
    db.prepare(
      'INSERT INTO version_snapshot (entity_type, entity_id, version, snapshot, changed_by, change_description) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('dataset', Number(req.params.id), newVersion, snapshotData, userId, `数据集更新至版本${newVersion}`)

    if (Array.isArray(fields)) {
      db.prepare('DELETE FROM desensitization_rule WHERE field_id IN (SELECT id FROM dataset_field WHERE dataset_id = ?)').run(req.params.id)
      db.prepare('DELETE FROM dataset_field WHERE dataset_id = ?').run(req.params.id)

      const insertField = db.prepare(
        'INSERT INTO dataset_field (dataset_id, name, type, is_desensitized, desensitization_type, description) VALUES (?, ?, ?, ?, ?, ?)'
      )
      const insertRule = db.prepare(
        'INSERT INTO desensitization_rule (field_id, type, params, version) VALUES (?, ?, ?, ?)'
      )

      for (const field of fields) {
        const fieldResult = insertField.run(
          Number(req.params.id),
          field.name,
          field.type || 'string',
          field.isDesensitized ? 1 : 0,
          field.desensitizationType || null,
          field.description || null,
        )
        if (field.isDesensitized && field.desensitizationRules?.length) {
          for (const rule of field.desensitizationRules) {
            insertRule.run(fieldResult.lastInsertRowid, rule.type, rule.params || null, 1)
          }
        }
      }
    }
  })

  updateDs()
  const updated = db.prepare('SELECT * FROM dataset WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const dataset = db.prepare('SELECT * FROM dataset WHERE id = ?').get(req.params.id) as any
  if (!dataset) {
    res.status(404).json({ success: false, error: '数据集不存在' })
    return
  }

  db.prepare("UPDATE dataset SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id)
  res.json({ success: true, data: { id: Number(req.params.id), status: 'archived' } })
})

router.get('/:id/versions', (req: Request, res: Response): void => {
  const snapshots = db.prepare(
    "SELECT * FROM version_snapshot WHERE entity_type = 'dataset' AND entity_id = ? ORDER BY version DESC"
  ).all(req.params.id) as any[]

  res.json({
    success: true,
    data: snapshots.map(s => ({
      id: s.id,
      entityType: s.entity_type,
      entityId: s.entity_id,
      version: s.version,
      snapshot: JSON.parse(s.snapshot),
      changedBy: s.changed_by,
      changedAt: s.changed_at,
      changeDescription: s.change_description,
    })),
  })
})

export default router
