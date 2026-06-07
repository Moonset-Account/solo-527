import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { returnOrders, products, shops, reasonNodes, warehouses, logisticsProviders, csStaff, dataUpdateLogs } from '../mock-data.js'
import type { ReturnOrder } from '../mock-data.js'

const router = Router()

interface ExportTask {
  id: string
  type: 'csv' | 'pdf'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  filterSnapshot: Record<string, unknown>
  sampleSize: number
  dataUpdateTime: string
  createdAt: string
  completedAt: string | null
  downloadUrl: string | null
}

const exportTasks: ExportTask[] = []

interface FilterParams {
  productIds?: string[]
  shopIds?: string[]
  reasonIds?: string[]
  warehouseIds?: string[]
  logisticsIds?: string[]
  dateStart?: string
  dateEnd?: string
}

function parseFilters(req: Request): FilterParams {
  return {
    productIds: req.body.productIds ?? req.query.productIds ? (req.body.productIds ?? (req.query.productIds as string)).split(',') : undefined,
    shopIds: req.body.shopIds ?? req.query.shopIds ? (req.body.shopIds ?? (req.query.shopIds as string)).split(',') : undefined,
    reasonIds: req.body.reasonIds ?? req.query.reasonIds ? (req.body.reasonIds ?? (req.query.reasonIds as string)).split(',') : undefined,
    warehouseIds: req.body.warehouseIds ?? req.query.warehouseIds ? (req.body.warehouseIds ?? (req.query.warehouseIds as string)).split(',') : undefined,
    logisticsIds: req.body.logisticsIds ?? req.query.logisticsIds ? (req.body.logisticsIds ?? (req.query.logisticsIds as string)).split(',') : undefined,
    dateStart: req.body.dateStart ?? req.query.dateStart as string | undefined,
    dateEnd: req.body.dateEnd ?? req.query.dateEnd as string | undefined,
  }
}

function filterOrders(orders: ReturnOrder[], filters: FilterParams): ReturnOrder[] {
  return orders.filter((o) => {
    if (filters.productIds?.length && !filters.productIds.includes(o.productId)) return false
    if (filters.shopIds?.length && !filters.shopIds.includes(o.shopId)) return false
    if (filters.reasonIds?.length && !filters.reasonIds.includes(o.reasonId)) return false
    if (filters.warehouseIds?.length && !filters.warehouseIds.includes(o.warehouseId)) return false
    if (filters.logisticsIds?.length && !filters.logisticsIds.includes(o.logisticsId)) return false
    if (filters.dateStart && new Date(o.applyAt) < new Date(filters.dateStart)) return false
    if (filters.dateEnd && new Date(o.applyAt) > new Date(filters.dateEnd)) return false
    return true
  })
}

function getDataUpdateTime(): string {
  const successLogs = dataUpdateLogs.filter((l) => l.status === 'success')
  if (successLogs.length === 0) return new Date().toISOString()
  return successLogs.reduce((latest, l) =>
    new Date(l.updateTime) > new Date(latest) ? l.updateTime : latest,
    successLogs[0].updateTime,
  )
}

router.post('/', (req: Request, res: Response): void => {
  const type = req.body.type as 'csv' | 'pdf'
  if (!type || !['csv', 'pdf'].includes(type)) {
    res.status(400).json({ success: false, error: 'type must be csv or pdf' })
    return
  }

  const filters = parseFilters(req)
  const filtered = filterOrders(returnOrders, filters)
  const task: ExportTask = {
    id: uuidv4(),
    type,
    status: 'pending',
    filterSnapshot: {
      productIds: filters.productIds ?? null,
      shopIds: filters.shopIds ?? null,
      reasonIds: filters.reasonIds ?? null,
      warehouseIds: filters.warehouseIds ?? null,
      logisticsIds: filters.logisticsIds ?? null,
      dateStart: filters.dateStart ?? null,
      dateEnd: filters.dateEnd ?? null,
    },
    sampleSize: filtered.length,
    dataUpdateTime: getDataUpdateTime(),
    createdAt: new Date().toISOString(),
    completedAt: null,
    downloadUrl: null,
  }

  exportTasks.push(task)

  setTimeout(() => {
    task.status = 'processing'
    setTimeout(() => {
      task.status = 'completed'
      task.completedAt = new Date().toISOString()
      task.downloadUrl = `/api/export/${task.id}/download`
    }, 1000)
  }, 1000)

  res.status(201).json({ success: true, data: task })
})

router.get('/', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: exportTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const task = exportTasks.find((t) => t.id === req.params.id)
  if (!task) {
    res.status(404).json({ success: false, error: 'Export task not found' })
    return
  }
  res.json({ success: true, data: task })
})

export default router
