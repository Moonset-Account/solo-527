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
    const list = await SortingOrder.find(filter)
      .populate({ path: 'harvestId', populate: { path: 'varietyId', select: 'name' } })
      .populate('sorter', 'name')
      .populate('inspector', 'name')
      .sort({ createdAt: -1 })
    const data = list.map((item: any) => ({
      id: item._id,
      orderNo: item.orderNo,
      harvestId: item.harvestId?._id,
      harvestBatch: item.harvestId?.batchNo || '',
      variety: item.harvestId?.varietyId?.name || '',
      harvestQuantity: item.harvestId?.quantity ? `${item.harvestId.quantity} ${item.harvestId.unit || 'kg'}` : '',
      sorter: item.sorter?.name || '',
      status: item.status,
      grades: item.grades || [],
      packaging: item.packaging,
      inspectResult: item.inspectResult,
      createdAt: item.createdAt,
    }))
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
    const entry = await SortingOrder.findById(req.params.id)
      .populate({ path: 'harvestId', populate: { path: 'varietyId', select: 'name' } })
      .populate('sorter', 'name')
      .populate('inspector', 'name')
    if (!entry) {
      res.status(404).json({ success: false, error: 'Sorting order not found' })
      return
    }
    const item: any = entry
    const data = {
      id: item._id,
      orderNo: item.orderNo,
      harvestId: item.harvestId?._id,
      harvestBatch: item.harvestId?.batchNo || '',
      variety: item.harvestId?.varietyId?.name || '',
      harvestQuantity: item.harvestId?.quantity ? `${item.harvestId.quantity} ${item.harvestId.unit || 'kg'}` : '',
      sorter: item.sorter?.name || '',
      status: item.status,
      grades: item.grades || [],
      packaging: item.packaging,
      inspectResult: item.inspectResult,
      inspector: item.inspector?.name || '',
      createdAt: item.createdAt,
    }
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData: any = {}
    if (req.body.status !== undefined) updateData.status = req.body.status
    if (req.body.sorter !== undefined) updateData.sorter = req.body.sorter
    if (req.body.packaging !== undefined) updateData.packaging = req.body.packaging
    if (req.body.grades !== undefined) {
      updateData.grades = req.body.grades.map((g: any) => ({
        grade: g.grade,
        quantity: Number(g.quantity) || 0,
        unit: g.unit || 'kg',
      }))
    }
    const entry = await SortingOrder.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
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
    const { grades, packaging } = req.body
    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      res.status(400).json({ success: false, error: 'Grades data is required' })
      return
    }
    const cleanGrades = grades.map((g: any) => ({
      grade: g.grade,
      quantity: Number(g.quantity) || 0,
      unit: g.unit || 'kg',
    }))
    const entry = await SortingOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', grades: cleanGrades, packaging, inspectResult: 'pending' },
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

router.post('/:id/inspect', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { inspectResult } = req.body
    if (!inspectResult || !['pass', 'fail'].includes(inspectResult)) {
      res.status(400).json({ success: false, error: 'Invalid inspect result' })
      return
    }
    const entry = await SortingOrder.findByIdAndUpdate(
      req.params.id,
      { inspectResult, status: 'inspected', inspector: req.user?.userId },
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
