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

router.get('/tasks', (req: Request, res: Response): void => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))

  const total = (db.prepare('SELECT COUNT(*) as count FROM export_task').get() as any).count
  const rows = db.prepare(
    `SELECT et.*, u.display_name as requested_by_name
     FROM export_task et
     LEFT JOIN user u ON et.requested_by = u.id
     ORDER BY et.created_at DESC LIMIT ? OFFSET ?`
  ).all(pageSize, (page - 1) * pageSize) as any[]

  res.json({
    success: true,
    data: {
      items: rows.map(r => ({
        id: r.id,
        reportIds: JSON.parse(r.report_ids),
        requestedBy: r.requested_by,
        requestedByName: r.requested_by_name,
        status: r.status,
        watermarkEnabled: !!r.watermark_enabled,
        securityNote: r.security_note,
        createdAt: r.created_at,
        completedAt: r.completed_at,
      })),
      total,
      page,
      pageSize,
    },
  })
})

router.post('/tasks', (req: Request, res: Response): void => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const { reportIds, watermarkEnabled, securityNote } = req.body
  if (!Array.isArray(reportIds) || reportIds.length === 0) {
    res.status(400).json({ success: false, error: '报表ID列表不能为空' })
    return
  }

  const createTask = db.transaction(() => {
    const taskResult = db.prepare(
      'INSERT INTO export_task (report_ids, requested_by, status, watermark_enabled, security_note) VALUES (?, ?, ?, ?, ?)'
    ).run(JSON.stringify(reportIds), userId, 'processing', watermarkEnabled !== false ? 1 : 0, securityNote || null)

    const taskId = taskResult.lastInsertRowid as number

    const statuses = ['success', 'failed', 'skipped']
    const failReasons = ['数据源连接超时', '数据量超出限制', '字段权限不足', '导出格式不支持']
    const skipReasons = ['无数据权限', '报表已下线', '数据集不存在']

    const insertResult = db.prepare(
      'INSERT INTO export_result (task_id, report_id, report_name, status, reason, file_path, duration) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )

    let hasFailure = false
    for (const reportId of reportIds) {
      const metric = db.prepare('SELECT name FROM metric WHERE id = ?').get(reportId) as any
      const reportName = metric?.name || `报表${reportId}`

      const rand = Math.random()
      let status: string
      let reason: string | null = null
      let filePath: string | null = null
      let duration: number | null = null

      if (rand < 0.6) {
        status = 'success'
        filePath = `/exports/${new Date().toISOString().slice(0, 7)}/${reportName}.xlsx`
        duration = Math.round((Math.random() * 25 + 5) * 10) / 10
      } else if (rand < 0.85) {
        status = 'failed'
        reason = failReasons[Math.floor(Math.random() * failReasons.length)]
        duration = Math.round(Math.random() * 30 * 10) / 10
        hasFailure = true
      } else {
        status = 'skipped'
        reason = skipReasons[Math.floor(Math.random() * skipReasons.length)]
      }

      insertResult.run(taskId, reportId, reportName, status, reason, filePath, duration)
    }

    const taskStatus = hasFailure ? 'partial' : 'completed'
    db.prepare(
      'UPDATE export_task SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(taskStatus, taskId)

    return taskId
  })

  const taskId = createTask()
  const task = db.prepare('SELECT * FROM export_task WHERE id = ?').get(taskId)

  res.status(201).json({ success: true, data: task })
})

router.get('/tasks/:id', (req: Request, res: Response): void => {
  const task = db.prepare(
    `SELECT et.*, u.display_name as requested_by_name
     FROM export_task et
     LEFT JOIN user u ON et.requested_by = u.id
     WHERE et.id = ?`
  ).get(req.params.id) as any

  if (!task) {
    res.status(404).json({ success: false, error: '导出任务不存在' })
    return
  }

  const results = db.prepare('SELECT * FROM export_result WHERE task_id = ?').all(req.params.id) as any[]

  res.json({
    success: true,
    data: {
      id: task.id,
      reportIds: JSON.parse(task.report_ids),
      requestedBy: task.requested_by,
      requestedByName: task.requested_by_name,
      status: task.status,
      watermarkEnabled: !!task.watermark_enabled,
      securityNote: task.security_note,
      createdAt: task.created_at,
      completedAt: task.completed_at,
      results: results.map(r => ({
        id: r.id,
        reportId: r.report_id,
        reportName: r.report_name,
        status: r.status,
        reason: r.reason,
        filePath: r.file_path,
        duration: r.duration,
      })),
    },
  })
})

router.get('/tasks/:id/summary', (req: Request, res: Response): void => {
  const task = db.prepare('SELECT * FROM export_task WHERE id = ?').get(req.params.id) as any
  if (!task) {
    res.status(404).json({ success: false, error: '导出任务不存在' })
    return
  }

  const summary = db.prepare(
    'SELECT status, COUNT(*) as count FROM export_result WHERE task_id = ? GROUP BY status'
  ).all(req.params.id) as any[]

  const counts: Record<string, number> = { success: 0, failed: 0, skipped: 0 }
  for (const row of summary) {
    counts[row.status] = row.count
  }

  res.json({
    success: true,
    data: {
      taskId: task.id,
      total: counts.success + counts.failed + counts.skipped,
      success: counts.success,
      failed: counts.failed,
      skipped: counts.skipped,
    },
  })
})

export default router
