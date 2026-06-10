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

router.get('/alerts', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await AlertRule.find().sort({ createdAt: -1 })
    const data = list.map((item: any) => ({
      id: item._id,
      name: item.name,
      type: item.type,
      condition: item.condition,
      notifyMethods: item.notifyMethods,
      active: item.active,
    }))
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/alerts', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await AlertRule.create(req.body)
    res.status(201).json({
      success: true,
      data: {
        id: entry._id,
        name: entry.name,
        type: entry.type,
        condition: entry.condition,
        notifyMethods: entry.notifyMethods,
        active: entry.active,
      },
    })
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
    res.json({
      success: true,
      data: {
        id: entry._id,
        name: entry.name,
        type: entry.type,
        condition: entry.condition,
        notifyMethods: entry.notifyMethods,
        active: entry.active,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/roles', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await Role.find().sort({ createdAt: 1 })
    const data = list.map((item: any) => ({
      id: item._id,
      name: item.name,
      permissions: item.permissions,
    }))
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/roles', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Role.create(req.body)
    res.status(201).json({
      success: true,
      data: {
        id: entry._id,
        name: entry.name,
        permissions: entry.permissions,
      },
    })
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
    res.json({
      success: true,
      data: {
        id: entry._id,
        name: entry.name,
        permissions: entry.permissions,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/logs', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit
    const filter: any = {}
    if (req.query.module) filter.module = req.query.module
    if (req.query.userId) filter.userId = req.query.userId
    if (req.query.action) filter.action = { $regex: req.query.action as string, $options: 'i' }
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {}
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate as string)
      if (req.query.endDate) filter.createdAt.$lte = new Date(new Date(req.query.endDate as string).getTime() + 24 * 3600 * 1000)
    }
    const [items, total] = await Promise.all([
      AuditLog.find(filter).populate('userId', 'name username').sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ])
    const data = items.map((item: any) => ({
      id: item._id,
      timestamp: item.createdAt,
      userId: item.userId?._id,
      userName: item.userId?.name || item.userId?.username || '',
      module: item.module,
      action: item.action,
      detail: item.detail,
    }))
    res.json({ success: true, data: { items, total, page, limit } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/export', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, module, startDate, endDate } = req.body
    const moduleParam = module || type
    const dateFilter: any = {}
    if (startDate) dateFilter.$gte = new Date(startDate as string)
    if (endDate) dateFilter.$lte = new Date(new Date(endDate as string).getTime() + 24 * 3600 * 1000)

    const wb = XLSX.utils.book_new()

    const exporters: Record<string, () => Promise<any[]>> = {
      plots: async () => { const d = await Plot.find(); return d.map(i => i.toObject()) },
      varieties: async () => { const d = await Variety.find(); return d.map(i => i.toObject()) },
      'farm-records': async () => { const d = await FarmRecord.find(Object.keys(dateFilter).length ? { operateDate: dateFilter } : {}).populate('plotId').populate('varietyId').populate('operator'); return d.map(i => i.toObject()) },
      farmRecords: async () => { const d = await FarmRecord.find(Object.keys(dateFilter).length ? { operateDate: dateFilter } : {}).populate('plotId').populate('varietyId').populate('operator'); return d.map(i => i.toObject()) },
      harvests: async () => { const d = await Harvest.find(Object.keys(dateFilter).length ? { harvestDate: dateFilter } : {}).populate('plotId').populate('varietyId').populate('harvester'); return d.map(i => i.toObject()) },
      sorting: async () => { const d = await SortingOrder.find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}).populate('harvestId').populate('sorter'); return d.map(i => i.toObject()) },
      sortingOrders: async () => { const d = await SortingOrder.find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}).populate('harvestId').populate('sorter'); return d.map(i => i.toObject()) },
      orders: async () => { const d = await Order.find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}).populate('varietyId'); return d.map(i => i.toObject()) },
      declarations: async () => { const d = await Declaration.find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}); return d.map(i => i.toObject()) },
      logs: async () => { const d = await AuditLog.find(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}).populate('userId'); return d.map(i => i.toObject()) },
    }

    const keyMap: Record<string, string> = {
      'farm-records': 'farmRecords',
      sorting: 'sortingOrders',
    }

    const moduleKeys: string[] = moduleParam
      ? (typeof moduleParam === 'string' ? moduleParam.split(',').filter(Boolean) : moduleParam)
      : Object.keys(exporters)
    const resolvedKeys = moduleKeys.map((k: string) => keyMap[k] || k)

    for (const m of resolvedKeys) {
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
