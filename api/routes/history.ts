import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/snapshots', (req: Request, res: Response): void => {
  const entityType = req.query.entity_type as string

  let where = 'WHERE 1=1'
  const params: any[] = []

  if (entityType) {
    where += ' AND vs.entity_type = ?'
    params.push(entityType)
  }

  const rows = db.prepare(
    `SELECT vs.*, u.display_name as changed_by_name
     FROM version_snapshot vs
     LEFT JOIN user u ON vs.changed_by = u.id
     ${where} ORDER BY vs.changed_at DESC`
  ).all(...params) as any[]

  res.json({
    success: true,
    data: rows.map(r => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      version: r.version,
      snapshot: JSON.parse(r.snapshot),
      changedBy: r.changed_by,
      changedByName: r.changed_by_name,
      changedAt: r.changed_at,
      changeDescription: r.change_description,
    })),
  })
})

router.get('/compare', (req: Request, res: Response): void => {
  const baselineId = Number(req.query.baselineId)
  const comparisonId = Number(req.query.comparisonId)

  if (!baselineId || !comparisonId) {
    res.status(400).json({ success: false, error: 'baselineId和comparisonId参数不能为空' })
    return
  }

  const baseline = db.prepare('SELECT * FROM version_snapshot WHERE id = ?').get(baselineId) as any
  const comparison = db.prepare('SELECT * FROM version_snapshot WHERE id = ?').get(comparisonId) as any

  if (!baseline) {
    res.status(404).json({ success: false, error: '基线版本快照不存在' })
    return
  }
  if (!comparison) {
    res.status(404).json({ success: false, error: '对比版本快照不存在' })
    return
  }

  const baselineData = JSON.parse(baseline.snapshot) as Record<string, any>
  const comparisonData = JSON.parse(comparison.snapshot) as Record<string, any>

  const allKeys = new Set([...Object.keys(baselineData), ...Object.keys(comparisonData)])
  const differences: Array<{
    field: string
    oldValue: any
    newValue: any
    changed: boolean
  }> = []

  for (const key of allKeys) {
    const oldValue = baselineData[key]
    const newValue = comparisonData[key]
    const changed = JSON.stringify(oldValue) !== JSON.stringify(newValue)
    differences.push({ field: key, oldValue, newValue, changed })
  }

  res.json({
    success: true,
    data: {
      baseline: {
        id: baseline.id,
        entityType: baseline.entity_type,
        entityId: baseline.entity_id,
        version: baseline.version,
        changedAt: baseline.changed_at,
        changeDescription: baseline.change_description,
      },
      comparison: {
        id: comparison.id,
        entityType: comparison.entity_type,
        entityId: comparison.entity_id,
        version: comparison.version,
        changedAt: comparison.changed_at,
        changeDescription: comparison.change_description,
      },
      differences,
    },
  })
})

export default router
