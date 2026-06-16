import { Router } from 'express'
import prisma from '../prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/logs', authMiddleware, async (req, res) => {
  const { page = 1, pageSize = 10, eventId, type, keyword } = req.query
  const where = {}
  if (eventId) where.eventId = parseInt(eventId)
  if (type) where.type = type
  if (keyword) {
    where.OR = [
      { description: { contains: keyword } },
      { sourceOrder: { contains: keyword } }
    ]
  }

  const [logs, total] = await Promise.all([
    prisma.revenueLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { name: true } },
        order: { select: { orderNo: true } },
        operator: { select: { name: true } }
      }
    }),
    prisma.revenueLog.count({ where })
  ])

  const totalAmount = await prisma.revenueLog.aggregate({
    where,
    _sum: { amount: true }
  })

  res.json({
    code: 0,
    data: {
      list: logs,
      total,
      totalAmount: parseFloat(totalAmount._sum.amount || 0),
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  })
})

router.get('/summary/:eventId', authMiddleware, async (req, res) => {
  const eventId = parseInt(req.params.eventId)

  const logs = await prisma.revenueLog.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' }
  })

  const totalIncome = logs
    .filter(l => parseFloat(l.amount) > 0)
    .reduce((sum, l) => sum + parseFloat(l.amount), 0)

  const totalRefund = logs
    .filter(l => parseFloat(l.amount) < 0)
    .reduce((sum, l) => sum + Math.abs(parseFloat(l.amount)), 0)

  const netRevenue = totalIncome - totalRefund

  const dailyData = {}
  logs.forEach(log => {
    const date = log.createdAt.toISOString().split('T')[0]
    if (!dailyData[date]) {
      dailyData[date] = { date, income: 0, refund: 0, net: 0 }
    }
    const amount = parseFloat(log.amount)
    if (amount > 0) {
      dailyData[date].income += amount
    } else {
      dailyData[date].refund += Math.abs(amount)
    }
    dailyData[date].net += amount
  })

  res.json({
    code: 0,
    data: {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalRefund: parseFloat(totalRefund.toFixed(2)),
      netRevenue: parseFloat(netRevenue.toFixed(2)),
      dailyTrend: Object.values(dailyData)
    }
  })
})

export default router
