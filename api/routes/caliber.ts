import { Router, type Request, type Response } from 'express'
import { caliberDefinitions } from '../data/mockData.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json(caliberDefinitions)
})

router.get('/:metricKey', (req: Request, res: Response) => {
  const def = caliberDefinitions.find(c => c.metricKey === req.params.metricKey)
  if (!def) {
    res.status(404).json({ error: '口径定义未找到' })
    return
  }
  res.json(def)
})

export default router
