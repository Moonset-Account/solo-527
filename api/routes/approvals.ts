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
  const status = req.query.status as string

  let where = 'WHERE 1=1'
  const params: any[] = []

  if (status) {
    where += ' AND ar.status = ?'
    params.push(status)
  }

  const rows = db.prepare(
    `SELECT ar.*, u1.display_name as requester_name, u2.display_name as reviewer_name
     FROM approval_request ar
     LEFT JOIN user u1 ON ar.requester_id = u1.id
     LEFT JOIN user u2 ON ar.reviewer_id = u2.id
     ${where} ORDER BY ar.created_at DESC`
  ).all(...params) as any[]

  res.json({
    success: true,
    data: rows.map(r => ({
      id: r.id,
      requesterId: r.requester_id,
      requesterName: r.requester_name,
      targetType: r.target_type,
      targetId: r.target_id,
      targetName: r.target_name,
      accessLevel: r.access_level,
      reason: r.reason,
      status: r.status,
      reviewerId: r.reviewer_id,
      reviewerName: r.reviewer_name,
      reviewComment: r.review_comment,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
    })),
  })
})

router.post('/', (req: Request, res: Response): void => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const { targetType, targetId, targetName, accessLevel, reason, expiresAt } = req.body
  if (!targetType || !targetId || !targetName) {
    res.status(400).json({ success: false, error: '目标类型、ID和名称不能为空' })
    return
  }

  const result = db.prepare(
    'INSERT INTO approval_request (requester_id, target_type, target_id, target_name, access_level, reason, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, targetType, targetId, targetName, accessLevel || 'view', reason || null, expiresAt || null)

  const request = db.prepare('SELECT * FROM approval_request WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: request })
})

router.put('/:id/approve', (req: Request, res: Response): void => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const approval = db.prepare('SELECT * FROM approval_request WHERE id = ?').get(req.params.id) as any
  if (!approval) {
    res.status(404).json({ success: false, error: '审批请求不存在' })
    return
  }
  if (approval.status !== 'pending') {
    res.status(400).json({ success: false, error: '该请求已处理' })
    return
  }

  const { reviewComment } = req.body
  db.prepare(
    "UPDATE approval_request SET status = 'approved', reviewer_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(userId, reviewComment || null, req.params.id)

  const updated = db.prepare('SELECT * FROM approval_request WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

router.put('/:id/reject', (req: Request, res: Response): void => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ success: false, error: '未认证' })
    return
  }

  const approval = db.prepare('SELECT * FROM approval_request WHERE id = ?').get(req.params.id) as any
  if (!approval) {
    res.status(404).json({ success: false, error: '审批请求不存在' })
    return
  }
  if (approval.status !== 'pending') {
    res.status(400).json({ success: false, error: '该请求已处理' })
    return
  }

  const { reviewComment } = req.body
  db.prepare(
    "UPDATE approval_request SET status = 'rejected', reviewer_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).run(userId, reviewComment || null, req.params.id)

  const updated = db.prepare('SELECT * FROM approval_request WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router
