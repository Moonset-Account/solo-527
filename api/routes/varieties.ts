import { Router, type Request, type Response } from 'express'
import Variety from '../models/Variety.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {}
    if (req.query.status) filter.status = req.query.status
    const data = await Variety.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Variety.create(req.body)
    res.status(201).json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Variety.findById(req.params.id)
    if (!entry) {
      res.status(404).json({ success: false, error: 'Variety not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Variety.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!entry) {
      res.status(404).json({ success: false, error: 'Variety not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Variety.findByIdAndDelete(req.params.id)
    if (!entry) {
      res.status(404).json({ success: false, error: 'Variety not found' })
      return
    }
    res.json({ success: true, data: null })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
