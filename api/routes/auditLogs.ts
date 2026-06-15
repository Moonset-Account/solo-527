import { Router, type Request, type Response } from 'express'
import AuditLog from '../models/AuditLog.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, any> = {}
    if (req.query.module) filter.module = req.query.module
    if (req.query.operatorId) filter.operatorId = req.query.operatorId
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = { $gte: new Date(req.query.startDate as string), $lte: new Date(req.query.endDate as string) }
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
