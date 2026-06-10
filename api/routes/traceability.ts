import { Router, type Request, type Response } from 'express'
import QRCode from 'qrcode'
import Harvest from '../models/Harvest.js'
import FarmRecord from '../models/FarmRecord.js'
import SortingOrder from '../models/SortingOrder.js'
import Shipment from '../models/Shipment.js'
import Order from '../models/Order.js'
import Traceability from '../models/Traceability.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/:batchNo', async (req: Request, res: Response): Promise<void> => {
  try {
    const harvest = await Harvest.findOne({ batchNo: req.params.batchNo }).populate('plotId').populate('varietyId').populate('harvester')
    if (!harvest) {
      res.status(404).json({ success: false, error: 'Batch not found' })
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

router.post('/generate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { harvestId } = req.body
    if (!harvestId) {
      res.status(400).json({ success: false, error: 'harvestId is required' })
      return
    }
    const harvest = await Harvest.findById(harvestId)
    if (!harvest) {
      res.status(404).json({ success: false, error: 'Harvest not found' })
      return
    }
    const batchNo = harvest.batchNo
    const existing = await Traceability.findOne({ harvestId })
    if (existing) {
      res.json({ success: true, data: { batchNo, qrCodeData: existing.qrCodeData } })
      return
    }
    const qrCodeData = await QRCode.toDataURL(batchNo)
    const trace = await Traceability.create({ batchNo, harvestId, qrCodeData })
    res.status(201).json({ success: true, data: { batchNo, qrCodeData: trace.qrCodeData } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
