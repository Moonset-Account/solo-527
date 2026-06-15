import { Router, type Request, type Response } from 'express'
import Closure from '../models/Closure.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: Record<string, any> = {}
    if (req.query.date) filter.date = req.query.date
    if (req.query.startDate && req.query.endDate) {
      filter.date = { $gte: req.query.startDate as string, $lte: req.query.endDate as string }
    }

    const closures = await Closure.find(filter).sort({ date: 1 })
    res.json({ success: true, data: closures })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const closure = await Closure.create(req.body)
    res.status(201).json({ success: true, data: closure })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

export default router
