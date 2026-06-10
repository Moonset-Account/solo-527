import { Router, type Request, type Response } from 'express'
import Harvest from '../models/Harvest.js'
import FarmRecord from '../models/FarmRecord.js'
import SortingOrder from '../models/SortingOrder.js'
import Declaration from '../models/Declaration.js'
import Order from '../models/Order.js'
import Shipment from '../models/Shipment.js'
import AlertRule from '../models/AlertRule.js'

const router = Router()

router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayHarvestCount = await Harvest.countDocuments({ harvestDate: { $gte: todayStart, $lte: todayEnd } })
    const pendingReviews = await FarmRecord.countDocuments({ status: 'pending' })
    const activeAlerts = await AlertRule.countDocuments({ active: true })

    const totalOrdered = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ])
    const totalShippedResult = await Shipment.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ])
    const ordered = totalOrdered[0]?.total || 0
    const shipped = totalShippedResult[0]?.total || 0
    const fulfillmentRate = ordered > 0 ? Math.round((shipped / ordered) * 10000) / 100 : 0

    res.json({
      success: true,
      data: {
        todayHarvestCount,
        pendingReviews,
        alertsCount: activeAlerts,
        fulfillmentRate,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/todos', async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingReviews = await FarmRecord.find({ status: 'pending' }).populate('plotId').populate('operator').sort({ createdAt: -1 })
    const pendingSorting = await SortingOrder.find({ status: 'pending' }).populate('harvestId').populate('sorter').sort({ createdAt: -1 })
    const missingDeclarations = await Declaration.find({ status: 'missing' }).sort({ createdAt: -1 })
    res.json({
      success: true,
      data: {
        pendingReviews,
        pendingSorting,
        missingDeclarations,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await AlertRule.find({ active: true }).sort({ createdAt: -1 })
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/harvest-trend', async (req: Request, res: Response): Promise<void> => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7
    const validDays = [7, 30].includes(days) ? days : 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - validDays)
    startDate.setHours(0, 0, 0, 0)

    const trend = await Harvest.aggregate([
      { $match: { harvestDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$harvestDate' },
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const result = []
    for (let i = 0; i < validDays; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const dateStr = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0')
      const found = trend.find(t => t._id === dateStr)
      result.push({
        date: dateStr,
        count: found?.count || 0,
        totalQuantity: found?.totalQuantity || 0,
      })
    }

    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
