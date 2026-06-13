import { Router, type Request, type Response } from 'express'
import { store } from '../store.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const quotas = store.quotaConfigs.getAll()
  res.json({ success: true, data: quotas })
})

router.post('/', (req: Request, res: Response): void => {
  const { building, repairType, maxQuota, period } = req.body

  if (!building || !repairType || maxQuota === undefined || !period) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }

  const existing = store.quotaConfigs.findByBuildingAndType(building, repairType)
  if (existing) {
    res.status(409).json({ success: false, error: '该楼栋和维修类型的名额配置已存在' })
    return
  }

  const config = store.quotaConfigs.create({
    building,
    repairType,
    maxQuota,
    currentUsed: 0,
    period,
  })

  res.status(201).json({ success: true, data: config })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const { maxQuota, period, currentUsed } = req.body

  const config = store.quotaConfigs.getById(id)
  if (!config) {
    res.status(404).json({ success: false, error: '名额配置不存在' })
    return
  }

  const updated = store.quotaConfigs.update(id, {
    ...(maxQuota !== undefined && { maxQuota }),
    ...(period !== undefined && { period }),
    ...(currentUsed !== undefined && { currentUsed }),
  })

  res.json({ success: true, data: updated })
})

router.get('/:id/usage', (req: Request, res: Response): void => {
  const { id } = req.params
  const config = store.quotaConfigs.getById(id)
  if (!config) {
    res.status(404).json({ success: false, error: '名额配置不存在' })
    return
  }

  const utilizationRate = config.maxQuota > 0 ? (config.currentUsed / config.maxQuota) * 100 : 0
  const remaining = config.maxQuota - config.currentUsed

  const relatedRequests = store.repairRequests.getAll().filter(
    r => r.building === config.building && r.repairType === config.repairType
  )

  const statusBreakdown: Record<string, number> = {}
  for (const r of relatedRequests) {
    statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1
  }

  res.json({
    success: true,
    data: {
      quota: config,
      usage: {
        currentUsed: config.currentUsed,
        maxQuota: config.maxQuota,
        remaining,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        isFull: config.currentUsed >= config.maxQuota,
        period: config.period,
      },
      statusBreakdown,
    },
  })
})

export default router
