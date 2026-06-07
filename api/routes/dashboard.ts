import { Router, type Request, type Response } from 'express'
import {
  returnOrders,
  products,
  shops,
  reasonNodes,
  warehouses,
  logisticsProviders,
  csStaff,
  dataUpdateLogs,
} from '../mock-data.js'
import type { ReturnOrder } from '../mock-data.js'

const router = Router()

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
    productIds: req.query.productIds ? (req.query.productIds as string).split(',') : undefined,
    shopIds: req.query.shopIds ? (req.query.shopIds as string).split(',') : undefined,
    reasonIds: req.query.reasonIds ? (req.query.reasonIds as string).split(',') : undefined,
    warehouseIds: req.query.warehouseIds ? (req.query.warehouseIds as string).split(',') : undefined,
    logisticsIds: req.query.logisticsIds ? (req.query.logisticsIds as string).split(',') : undefined,
    dateStart: req.query.dateStart as string | undefined,
    dateEnd: req.query.dateEnd as string | undefined,
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

function buildFilterSnapshot(filters: FilterParams) {
  return {
    productIds: filters.productIds ?? null,
    shopIds: filters.shopIds ?? null,
    reasonIds: filters.reasonIds ?? null,
    warehouseIds: filters.warehouseIds ?? null,
    logisticsIds: filters.logisticsIds ?? null,
    dateStart: filters.dateStart ?? null,
    dateEnd: filters.dateEnd ?? null,
  }
}

function getDataUpdateTime(): string {
  const successLogs = dataUpdateLogs.filter((l) => l.status === 'success')
  if (successLogs.length === 0) return new Date().toISOString()
  return successLogs.reduce((latest, l) =>
    new Date(l.updateTime) > new Date(latest) ? l.updateTime : latest,
    successLogs[0].updateTime,
  )
}

router.get('/overview', (req: Request, res: Response): void => {
  const filters = parseFilters(req)
  const filtered = filterOrders(returnOrders, filters)

  const totalReturns = filtered.length
  const anomalyCount = filtered.filter((o) => o.isAnomaly).length
  const anomalyRate = totalReturns > 0 ? parseFloat((anomalyCount / totalReturns * 100).toFixed(2)) : 0

  const refundedOrders = filtered.filter((o) => o.refundAt && o.applyAt)
  const avgRefundCycleDays = refundedOrders.length > 0
    ? parseFloat((refundedOrders.reduce((sum, o) => {
        return sum + (new Date(o.refundAt!).getTime() - new Date(o.applyAt).getTime()) / 86400000
      }, 0) / refundedOrders.length).toFixed(2))
    : 0

  const totalRefundAmount = filtered.reduce((sum, o) => sum + o.refundAmount, 0)
  const productIdsInScope = [...new Set(filtered.map((o) => o.productId))]
  const productsInScope = products.filter((p) => productIdsInScope.includes(p.id))
  const totalSales = productsInScope.reduce((sum, p) => sum + p.monthlySales, 0)
  const returnRate = totalSales > 0 ? parseFloat((totalReturns / totalSales * 100).toFixed(2)) : 0

  res.json({
    success: true,
    data: {
      totalReturns,
      avgRefundCycleDays,
      returnRate,
      anomalyRate,
      totalRefundAmount: parseFloat(totalRefundAmount.toFixed(2)),
      sampleSize: filtered.length,
      filterSnapshot: buildFilterSnapshot(filters),
      dataUpdateTime: getDataUpdateTime(),
    },
  })
})

router.get('/reason-tree', (req: Request, res: Response): void => {
  const filters = parseFilters(req)
  const filtered = filterOrders(returnOrders, filters)

  const reasonCountMap = new Map<string, number>()
  filtered.forEach((o) => {
    reasonCountMap.set(o.reasonId, (reasonCountMap.get(o.reasonId) ?? 0) + 1)
  })

  function buildTree(parentId: string | null) {
    return reasonNodes
      .filter((r) => r.parentId === parentId)
      .map((r) => {
        const children = buildTree(r.id)
        const directCount = r.level === 3 ? (reasonCountMap.get(r.id) ?? 0) : 0
        const childTotal = children.reduce((s, c) => s + c.count, 0)
        return {
          id: r.id,
          name: r.name,
          level: r.level,
          count: directCount + childTotal,
          children,
        }
      })
  }

  const tree = buildTree(null)

  res.json({
    success: true,
    data: {
      tree,
      sampleSize: filtered.length,
      filterSnapshot: buildFilterSnapshot(filters),
      dataUpdateTime: getDataUpdateTime(),
    },
  })
})

router.get('/cycle-distribution', (req: Request, res: Response): void => {
  const filters = parseFilters(req)
  const filtered = filterOrders(returnOrders, filters)

  const refundedOrders = filtered.filter((o) => o.refundAt && o.applyAt)
  const cycleDays = refundedOrders.map((o) =>
    (new Date(o.refundAt!).getTime() - new Date(o.applyAt).getTime()) / 86400000,
  )

  const bins = [
    { label: '0-2天', min: 0, max: 2, count: 0 },
    { label: '2-5天', min: 2, max: 5, count: 0 },
    { label: '5-8天', min: 5, max: 8, count: 0 },
    { label: '8-12天', min: 8, max: 12, count: 0 },
    { label: '12-15天', min: 12, max: 15, count: 0 },
    { label: '15天以上', min: 15, max: Infinity, count: 0 },
  ]
  cycleDays.forEach((d) => {
    const bin = bins.find((b) => d >= b.min && d < b.max)
    if (bin) bin.count++
  })

  const stageBreakdown = {
    applyToQualityCheck: [] as number[],
    qualityCheckToApprove: [] as number[],
    approveToRefund: [] as number[],
  }

  refundedOrders.forEach((o) => {
    const apply = new Date(o.applyAt).getTime()
    const qc = o.qualityCheckAt ? new Date(o.qualityCheckAt).getTime() : null
    const approve = o.approveAt ? new Date(o.approveAt).getTime() : null
    const refund = new Date(o.refundAt!).getTime()

    if (qc) stageBreakdown.applyToQualityCheck.push((qc - apply) / 86400000)
    if (qc && approve) stageBreakdown.qualityCheckToApprove.push((approve - qc) / 86400000)
    if (approve && refund) stageBreakdown.approveToRefund.push((refund - approve) / 86400000)
  })

  function avg(arr: number[]): number {
    return arr.length > 0 ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2)) : 0
  }

  res.json({
    success: true,
    data: {
      bins,
      stageBreakdown: {
        applyToQualityCheck: { avg: avg(stageBreakdown.applyToQualityCheck), count: stageBreakdown.applyToQualityCheck.length },
        qualityCheckToApprove: { avg: avg(stageBreakdown.qualityCheckToApprove), count: stageBreakdown.qualityCheckToApprove.length },
        approveToRefund: { avg: avg(stageBreakdown.approveToRefund), count: stageBreakdown.approveToRefund.length },
      },
      sampleSize: filtered.length,
      filterSnapshot: buildFilterSnapshot(filters),
      dataUpdateTime: getDataUpdateTime(),
    },
  })
})

router.get('/product-ranking', (req: Request, res: Response): void => {
  const filters = parseFilters(req)
  const filtered = filterOrders(returnOrders, filters)

  const productStats = new Map<string, { returnCount: number; refundAmount: number; returnRate: number }>()

  filtered.forEach((o) => {
    const stat = productStats.get(o.productId) ?? { returnCount: 0, refundAmount: 0, returnRate: 0 }
    stat.returnCount++
    stat.refundAmount += o.refundAmount
    productStats.set(o.productId, stat)
  })

  const ranking = products
    .map((p) => {
      const stat = productStats.get(p.id) ?? { returnCount: 0, refundAmount: 0 }
      return {
        productId: p.id,
        productName: p.name,
        category: p.category,
        shopId: p.shopId,
        shopName: shops.find((s) => s.id === p.shopId)?.name ?? '',
        price: p.price,
        monthlySales: p.monthlySales,
        returnCount: stat.returnCount,
        returnRate: p.monthlySales > 0 ? parseFloat((stat.returnCount / p.monthlySales * 100).toFixed(2)) : 0,
        totalRefundAmount: parseFloat(stat.refundAmount.toFixed(2)),
      }
    })
    .filter((r) => r.returnCount > 0)
    .sort((a, b) => b.returnCount - a.returnCount)

  res.json({
    success: true,
    data: {
      ranking,
      sampleSize: filtered.length,
      filterSnapshot: buildFilterSnapshot(filters),
      dataUpdateTime: getDataUpdateTime(),
    },
  })
})

router.get('/cs-duration', (req: Request, res: Response): void => {
  const filters = parseFilters(req)
  const filtered = filterOrders(returnOrders, filters)

  const staffStats = new Map<string, { durations: number[]; orderCount: number; anomalyCount: number }>()

  filtered.forEach((o) => {
    const stat = staffStats.get(o.csStaffId) ?? { durations: [], orderCount: 0, anomalyCount: 0 }
    stat.orderCount++
    if (o.isAnomaly) stat.anomalyCount++

    if (o.applyAt && o.refundAt) {
      const hours = (new Date(o.refundAt).getTime() - new Date(o.applyAt).getTime()) / 3600000
      stat.durations.push(hours)
    }

    staffStats.set(o.csStaffId, stat)
  })

  const staffData = csStaff.map((s) => {
    const stat = staffStats.get(s.id) ?? { durations: [], orderCount: 0, anomalyCount: 0 }
    const avgDuration = stat.durations.length > 0
      ? parseFloat((stat.durations.reduce((sum, d) => sum + d, 0) / stat.durations.length).toFixed(2))
      : 0
    return {
      staffId: s.id,
      staffName: s.name,
      role: s.role,
      orderCount: stat.orderCount,
      avgDurationHours: avgDuration,
      anomalyCount: stat.anomalyCount,
      anomalyRate: stat.orderCount > 0 ? parseFloat((stat.anomalyCount / stat.orderCount * 100).toFixed(2)) : 0,
    }
  }).sort((a, b) => b.orderCount - a.orderCount)

  res.json({
    success: true,
    data: {
      staffData,
      sampleSize: filtered.length,
      filterSnapshot: buildFilterSnapshot(filters),
      dataUpdateTime: getDataUpdateTime(),
    },
  })
})

router.get('/samples', (req: Request, res: Response): void => {
  const filters = parseFilters(req)
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const anomalyOnly = req.query.anomalyOnly === 'true'

  let filtered = filterOrders(returnOrders, filters)
  if (anomalyOnly) {
    filtered = filtered.filter((o) => o.isAnomaly)
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  const samples = paged.map((o) => {
    const product = products.find((p) => p.id === o.productId)
    const shop = shops.find((s) => s.id === o.shopId)
    const reason = reasonNodes.find((r) => r.id === o.reasonId)
    const warehouse = warehouses.find((w) => w.id === o.warehouseId)
    const logistics = logisticsProviders.find((l) => l.id === o.logisticsId)
    const staff = csStaff.find((s) => s.id === o.csStaffId)

    const cycleDays = o.refundAt && o.applyAt
      ? parseFloat(((new Date(o.refundAt).getTime() - new Date(o.applyAt).getTime()) / 86400000).toFixed(2))
      : null

    return {
      id: o.id,
      orderId: o.orderId,
      userHashId: o.userHashId,
      productName: product?.name ?? '',
      category: product?.category ?? '',
      shopName: shop?.name ?? '',
      platform: shop?.platform ?? '',
      reasonName: reason?.name ?? '',
      warehouseName: warehouse?.name ?? '',
      logisticsName: logistics?.name ?? '',
      csStaffName: staff?.name ?? '',
      applyAt: o.applyAt,
      qualityCheckAt: o.qualityCheckAt,
      approveAt: o.approveAt,
      refundAt: o.refundAt,
      cycleDays,
      refundAmount: o.refundAmount,
      status: o.status,
      isAnomaly: o.isAnomaly,
      csNote: o.csNote,
      geoPoint: o.geoPoint,
    }
  })

  res.json({
    success: true,
    data: {
      samples,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      sampleSize: filtered.length,
      filterSnapshot: buildFilterSnapshot(filters),
      dataUpdateTime: getDataUpdateTime(),
    },
  })
})

router.get('/geo-heatmap', (req: Request, res: Response): void => {
  const filters = parseFilters(req)
  const filtered = filterOrders(returnOrders, filters)

  const geoGrid = new Map<string, { lng: number; lat: number; count: number; totalRefund: number; anomalyCount: number }>()

  const gridSize = 1
  filtered.forEach((o) => {
    const gridLng = Math.floor(o.geoPoint.lng / gridSize) * gridSize + gridSize / 2
    const gridLat = Math.floor(o.geoPoint.lat / gridSize) * gridSize + gridSize / 2
    const key = `${gridLng},${gridLat}`

    const cell = geoGrid.get(key) ?? { lng: gridLng, lat: gridLat, count: 0, totalRefund: 0, anomalyCount: 0 }
    cell.count++
    cell.totalRefund += o.refundAmount
    if (o.isAnomaly) cell.anomalyCount++
    geoGrid.set(key, cell)
  })

  const heatmapData = [...geoGrid.values()].map((cell) => ({
    ...cell,
    totalRefund: parseFloat(cell.totalRefund.toFixed(2)),
    anomalyRate: cell.count > 0 ? parseFloat((cell.anomalyCount / cell.count * 100).toFixed(2)) : 0,
  }))

  res.json({
    success: true,
    data: {
      heatmapData,
      sampleSize: filtered.length,
      filterSnapshot: buildFilterSnapshot(filters),
      dataUpdateTime: getDataUpdateTime(),
    },
  })
})

export default router
