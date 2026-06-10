import { Router, type Request, type Response } from 'express'
import SortingOrder from '../models/SortingOrder.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

async function generateOrderNo(): Promise<string> {
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')
  const prefix = `SO-${dateStr}-`
  const last = await SortingOrder.findOne({ orderNo: { $regex: `^${prefix}` } }).sort({ orderNo: -1 })
  let seq = 1
  if (last) {
    const lastSeq = parseInt(last.orderNo.slice(-4), 10)
    seq = lastSeq + 1
  }
  return prefix + String(seq).padStart(4, '0')
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {}
    if (req.query.harvestId) filter.harvestId = req.query.harvestId
    if (req.query.status) filter.status = req.query.status
    const data = await SortingOrder.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const orderNo = await generateOrderNo()
    const body = { ...req.body, orderNo, sorter: req.body.sorter || req.user?.userId }
    const entry = await SortingOrder.create(body)
    res.status(201).json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await SortingOrder.findById(req.params.id).populate('harvestId').populate('sorter').populate('inspector')
    if (!entry) {
      res.status(404).json({ success: false, error: 'Sorting order not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await SortingOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!entry) {
      res.status(404).json({ success: false, error: 'Sorting order not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/complete', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { grades, packaging, inspectResult } = req.body
    const entry = await SortingOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', grades, packaging, inspectResult: inspectResult || 'pending', inspector: req.user?.userId },
      { new: true, runValidators: true },
    )
    if (!entry) {
      res.status(404).json({ success: false, error: 'Sorting order not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await SortingOrder.findByIdAndDelete(req.params.id)
    if (!entry) {
      res.status(404).json({ success: false, error: 'Sorting order not found' })
      return
    }
    res.json({ success: true, data: null })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
