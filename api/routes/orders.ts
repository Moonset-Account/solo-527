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
    const data = await Order.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data })
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
    res.json({ success: true, data: entry })
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
