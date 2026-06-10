import { Router, type Request, type Response } from 'express'
import Order from '../models/Order.js'
import Shipment from '../models/Shipment.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

async function generateOrderNo(): Promise<string> {
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0')
  const prefix = `OD-${dateStr}-`
  const last = await Order.findOne({ orderNo: { $regex: `^${prefix}` } }).sort({ orderNo: -1 })
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
    if (req.query.status) filter.status = req.query.status
    if (req.query.customer) filter.customer = { $regex: req.query.customer as string, $options: 'i' }
    const list = await Order.find(filter)
      .populate('varietyId', 'name')
      .sort({ createdAt: -1 })
    const data = list.map(async (item: any) => {
      const shipments = await Shipment.find({ orderId: item._id })
      const totalShipped = shipments.reduce((sum, s) => sum + s.quantity, 0)
      const fulfillmentRate = item.quantity > 0 ? Math.round((totalShipped / item.quantity) * 10000) / 100 : 0
      return {
        id: item._id,
        orderNo: item.orderNo,
        customer: item.customer,
        varietyId: item.varietyId?._id,
        variety: item.varietyId?.name || '',
        quantity: item.quantity,
        unit: item.unit || 'kg',
        unitPrice: item.unitPrice,
        status: item.status,
        deadline: item.deadline,
        fulfillmentRate,
        createdAt: item.createdAt,
      }
    })
    const resolved = await Promise.all(data)
    res.json({ success: true, data: resolved })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const orderNo = await generateOrderNo()
    const body = { ...req.body, orderNo }
    const entry = await Order.create(body)
    res.status(201).json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Order.findById(req.params.id).populate('varietyId')
    if (!entry) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    const shipments = await Shipment.find({ orderId: entry._id }).populate('sortingOrderId', 'orderNo variety')
    const totalShipped = shipments.reduce((sum, s) => sum + s.quantity, 0)
    const fulfillmentRate = entry.quantity > 0 ? Math.round((totalShipped / entry.quantity) * 10000) / 100 : 0
    const shipmentsData = shipments.map((s: any) => ({
      id: s._id,
      orderId: s.orderId,
      sortingOrderId: s.sortingOrderId?._id,
      sortingOrderNo: s.sortingOrderId?.orderNo || '',
      sortingOrderVariety: s.sortingOrderId?.variety || '',
      quantity: s.quantity,
      trackingNo: s.trackingNo,
      shipDate: s.shipDate,
    }))
    const data = {
      id: entry._id,
      orderNo: entry.orderNo,
      customer: entry.customer,
      varietyId: entry.varietyId?._id,
      variety: entry.varietyId?.name || '',
      quantity: entry.quantity,
      unit: entry.unit || 'kg',
      unitPrice: entry.unitPrice,
      status: entry.status,
      deadline: entry.deadline,
      totalShipped,
      fulfillmentRate,
      shipments: shipmentsData,
      createdAt: entry.createdAt,
    }
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!entry) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id/fulfillment', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    const shipments = await Shipment.find({ orderId: order._id })
    const totalOrdered = order.quantity
    const totalShipped = shipments.reduce((sum, s) => sum + s.quantity, 0)
    const fulfillmentRate = totalOrdered > 0 ? Math.round((totalShipped / totalOrdered) * 10000) / 100 : 0
    res.json({ success: true, data: { totalOrdered, totalShipped, fulfillmentRate } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/ship', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { sortingOrderId, quantity, trackingNo } = req.body
    const order = await Order.findById(req.params.id)
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    const shipment = await Shipment.create({
      orderId: order._id,
      sortingOrderId,
      quantity,
      shipDate: new Date(),
      trackingNo,
    })
    const shipments = await Shipment.find({ orderId: order._id })
    const totalShipped = shipments.reduce((sum, s) => sum + s.quantity, 0)
    if (totalShipped >= order.quantity) {
      order.status = 'shipped'
      await order.save()
    } else if (totalShipped > 0) {
      order.status = 'processing'
      await order.save()
    }
    res.status(201).json({ success: true, data: shipment })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Order.findByIdAndDelete(req.params.id)
    if (!entry) {
      res.status(404).json({ success: false, error: 'Order not found' })
      return
    }
    res.json({ success: true, data: null })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
