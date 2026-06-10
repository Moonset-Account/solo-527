import { Router, type Request, type Response } from 'express'
import FarmRecord from '../models/FarmRecord.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {}
    if (req.query.plotId) filter.plotId = req.query.plotId
    if (req.query.varietyId) filter.varietyId = req.query.varietyId
    if (req.query.type) filter.type = req.query.type
    if (req.query.status) filter.status = req.query.status
    if (req.query.startDate || req.query.endDate) {
      filter.operateDate = {}
      if (req.query.startDate) filter.operateDate.$gte = new Date(req.query.startDate as string)
      if (req.query.endDate) filter.operateDate.$lte = new Date(req.query.endDate as string)
    }
    const data = await FarmRecord.find(filter).sort({ operateDate: -1 })
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const body = { ...req.body, status: req.body.status || 'pending', operator: req.body.operator || req.user?.userId }
    const entry = await FarmRecord.create(body)
    res.status(201).json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await FarmRecord.findById(req.params.id).populate('plotId').populate('varietyId').populate('operator')
    if (!entry) {
      res.status(404).json({ success: false, error: 'Farm record not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await FarmRecord.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!entry) {
      res.status(404).json({ success: false, error: 'Farm record not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/review', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, remark } = req.body
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid review status' })
      return
    }
    const entry = await FarmRecord.findByIdAndUpdate(
      req.params.id,
      { status, reviewRemark: remark, reviewer: req.user?.userId, reviewDate: new Date() },
      { new: true, runValidators: true },
    )
    if (!entry) {
      res.status(404).json({ success: false, error: 'Farm record not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await FarmRecord.findByIdAndDelete(req.params.id)
    if (!entry) {
      res.status(404).json({ success: false, error: 'Farm record not found' })
      return
    }
    res.json({ success: true, data: null })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
