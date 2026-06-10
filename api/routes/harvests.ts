import { Router, type Request, type Response } from 'express'
import Harvest from '../models/Harvest.js'
import FarmRecord from '../models/FarmRecord.js'
import SortingOrder from '../models/SortingOrder.js'
import Shipment from '../models/Shipment.js'
import Order from '../models/Order.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

async function generateBatchNo(): Promise<string> {
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')
  const prefix = `HV-${dateStr}-`
  const last = await Harvest.findOne({ batchNo: { $regex: `^${prefix}` } }).sort({ batchNo: -1 })
  let seq = 1
  if (last) {
    const lastSeq = parseInt(last.batchNo.slice(-4), 10)
    seq = lastSeq + 1
  }
  return prefix + String(seq).padStart(4, '0')
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {}
    if (req.query.plotId) filter.plotId = req.query.plotId
    if (req.query.varietyId) filter.varietyId = req.query.varietyId
    if (req.query.qualityGrade) filter.qualityGrade = req.query.qualityGrade
    if (req.query.startDate || req.query.endDate) {
      filter.harvestDate = {}
      if (req.query.startDate) filter.harvestDate.$gte = new Date(req.query.startDate as string)
      if (req.query.endDate) filter.harvestDate.$lte = new Date(req.query.endDate as string)
    }
    const data = await Harvest.find(filter).sort({ harvestDate: -1 })
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const batchNo = await generateBatchNo()
    const body = { ...req.body, batchNo, harvester: req.body.harvester || req.user?.userId }
    const entry = await Harvest.create(body)
    res.status(201).json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Harvest.findById(req.params.id).populate('plotId').populate('varietyId').populate('harvester')
    if (!entry) {
      res.status(404).json({ success: false, error: 'Harvest not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Harvest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!entry) {
      res.status(404).json({ success: false, error: 'Harvest not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Harvest.findByIdAndDelete(req.params.id)
    if (!entry) {
      res.status(404).json({ success: false, error: 'Harvest not found' })
      return
    }
    res.json({ success: true, data: null })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id/trace', async (req: Request, res: Response): Promise<void> => {
  try {
    const harvest = await Harvest.findById(req.params.id).populate('plotId').populate('varietyId').populate('harvester')
    if (!harvest) {
      res.status(404).json({ success: false, error: 'Harvest not found' })
      return
    }
    const farmRecords = await FarmRecord.find({ plotId: harvest.plotId }).populate('plotId').populate('varietyId').populate('operator')
    const sortingOrders = await SortingOrder.find({ harvestId: harvest._id }).populate('sorter').populate('inspector')
    const sortingIds = sortingOrders.map(s => s._id)
    const shipments = await Shipment.find({ sortingOrderId: { $in: sortingIds } })
    const orderIds = shipments.map(s => s.orderId)
    const orders = await Order.find({ _id: { $in: orderIds } }).populate('varietyId')
    res.json({
      success: true,
      data: {
        harvest,
        farmRecords,
        sortingOrders,
        shipments,
        orders,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
