import { Router, type Request, type Response } from 'express'
import Role from '../models/Role.js'
import AuditLog from '../models/AuditLog.js'
import AlertRule from '../models/AlertRule.js'
import Plot from '../models/Plot.js'
import Variety from '../models/Variety.js'
import FarmRecord from '../models/FarmRecord.js'
import Harvest from '../models/Harvest.js'
import SortingOrder from '../models/SortingOrder.js'
import Order from '../models/Order.js'
import Declaration from '../models/Declaration.js'
import { authMiddleware } from '../middleware/auth.js'
import XLSX from 'xlsx'

const router = Router()

router.get('/roles', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await Role.find().sort({ createdAt: 1 })
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/roles', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Role.create(req.body)
    res.status(201).json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/roles/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!entry) {
      res.status(404).json({ success: false, error: 'Role not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/logs', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      AuditLog.find().populate('userId').sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(),
    ])
    res.json({ success: true, data: { items: data, total, page, limit } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/export', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { module } = req.body
    const wb = XLSX.utils.book_new()

    const exporters: Record<string, () => Promise<any[]>> = {
      plots: async () => { const d = await Plot.find(); return d.map(i => i.toObject()) },
      varieties: async () => { const d = await Variety.find(); return d.map(i => i.toObject()) },
      farmRecords: async () => { const d = await FarmRecord.find().populate('plotId').populate('varietyId').populate('operator'); return d.map(i => i.toObject()) },
      harvests: async () => { const d = await Harvest.find().populate('plotId').populate('varietyId').populate('harvester'); return d.map(i => i.toObject()) },
      sortingOrders: async () => { const d = await SortingOrder.find().populate('harvestId').populate('sorter'); return d.map(i => i.toObject()) },
      orders: async () => { const d = await Order.find().populate('varietyId'); return d.map(i => i.toObject()) },
      declarations: async () => { const d = await Declaration.find(); return d.map(i => i.toObject()) },
    }

    const modules = module ? [module] : Object.keys(exporters)
    for (const m of modules) {
      if (exporters[m]) {
        const data = await exporters[m]()
        const ws = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(wb, ws, m)
      }
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=export.xlsx')
    res.send(buffer)
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/alerts', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await AlertRule.find().sort({ createdAt: -1 })
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/alerts/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await AlertRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!entry) {
      res.status(404).json({ success: false, error: 'Alert rule not found' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
