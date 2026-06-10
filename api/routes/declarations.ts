import { Router, type Request, type Response } from 'express'
import Declaration from '../models/Declaration.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const total = await Declaration.countDocuments()
    const complete = await Declaration.countDocuments({ status: 'complete' })
    const missing = await Declaration.countDocuments({ status: 'missing' })
    const processing = await Declaration.countDocuments({ status: 'processing' })
    res.json({ success: true, data: { total, complete, missing, processing } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.harvestId) filter.harvestId = req.query.harvestId
    const data = await Declaration.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Declaration.create(req.body)
    res.status(201).json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Declaration.findById(req.params.id)
    if (!entry) {
      res.status(404).json({ success: false, error: 'Declaration not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Declaration.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!entry) {
      res.status(404).json({ success: false, error: 'Declaration not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
