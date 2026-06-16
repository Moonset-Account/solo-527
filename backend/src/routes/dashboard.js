import { Router } from 'express'
import prisma from '../prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/summary', authMiddleware, async (req, res) => {
  const { eventId } = req.query

  const where = eventId ? { eventId: parseInt(eventId) } : {}

  const [totalEvents, totalOrders, totalRevenue, totalCheckIns, pendingRefunds] = await Promise.all([
    prisma.event.count({ where: eventId ? { id: parseInt(eventId) } : {} }),
    prisma.order.count({ where: { ...where, status: 'PAID' } }),
    prisma.revenueLog.aggregate({
      where,
      _sum: { amount: true }
    }),
    prisma.checkIn.count({ where: { ...where, status: 'SUCCESS' } }),
    prisma.refund.count({ where: { status: 'PENDING' } })
  ])

  const totalAmount = parseFloat(totalRevenue._sum.amount || 0)

  const attendanceRate = totalOrders > 0
    ? (totalCheckIns / totalOrders * 100).toFixed(2)
    : '0.00'

  res.json({
    code: 0,
    data: {
      totalEvents,
      totalOrders,
      totalRevenue: totalAmount,
      totalCheckIns,
      attendanceRate: parseFloat(attendanceRate),
      pendingRefunds
    }
  })
})

router.get('/conversion', authMiddleware, async (req, res) => {
  const { eventId } = req.query
  const where = eventId ? { eventId: parseInt(eventId) } : {}

  const events = await prisma.event.findMany({
    where: eventId ? { id: parseInt(eventId) } : {},
    include: {
      sessions: true,
      tickets: true,
      _count: {
        select: { orders: true }
      }
    }
  })

  const conversionData = events.map(event => {
    const totalInventory = event.tickets.reduce((sum, t) => sum + t.quantity, 0)
    const totalSold = event.tickets.reduce((sum, t) => sum + t.sold, 0)
    const totalCheckedIn = event.sessions.reduce((sum, s) => sum + s.checkedIn, 0)

    return {
      eventId: event.id,
      eventName: event.name,
      totalInventory,
      totalSold,
      conversionRate: totalInventory > 0 ? (totalSold / totalInventory * 100).toFixed(2) : '0.00',
      totalCheckedIn,
      attendanceRate: totalSold > 0 ? (totalCheckedIn / totalSold * 100).toFixed(2) : '0.00'
    }
  })

  res.json({ code: 0, data: conversionData })
})

router.get('/revenue/trend', authMiddleware, async (req, res) => {
  const { eventId } = req.query
  const where = eventId ? { eventId: parseInt(eventId) } : {}

  const logs = await prisma.revenueLog.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: { event: { select: { name: true } } }
  })

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

  res.json({ code: 0, data: Object.values(dailyData) })
})

router.get('/review/summary', authMiddleware, async (req, res) => {
  const { eventId } = req.query

  if (!eventId) {
    return res.json({ code: 1, message: '请选择活动' })
  }

  const eid = parseInt(eventId)
  const event = await prisma.event.findUnique({
    where: { id: eid },
    include: {
      sessions: { orderBy: { startTime: 'asc' } },
      tickets: true,
      _count: { select: { orders: true, feedbacks: true } }
    }
  })

  const feedbacks = await prisma.feedback.findMany({
    where: { eventId: eid },
    include: { order: { select: { orderNo: true, sourceOrder: true } } }
  })

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0.0'

  const revenueLogs = await prisma.revenueLog.findMany({
    where: { eventId: eid },
    orderBy: { createdAt: 'desc' },
    include: { operator: { select: { name: true } } }
  })

  const totalRevenue = parseFloat(
    revenueLogs.reduce((sum, log) => sum + parseFloat(log.amount), 0).toFixed(2)
  )

  const failedCheckIns = await prisma.checkIn.findMany({
    where: { eventId: eid, status: 'FAILED' },
    orderBy: { createdAt: 'desc' },
    include: {
      order: { select: { orderNo: true, sourceOrder: true } },
      session: { select: { name: true } },
      user: { select: { name: true } },
      operator: { select: { name: true } },
      orderItem: { select: { ticketName: true, seatName: true } }
    }
  })

  const checkInStats = event.sessions.map(session => {
    const successCount = session.checkedIn
    const sessionFailedCount = failedCheckIns.filter(c => c.sessionId === session.id).length
    const attendanceRateBefore = session.soldSeats > 0
      ? (successCount / session.soldSeats * 100).toFixed(2)
      : '0.00'
    const adjustedRate = session.soldSeats > 0
      ? ((successCount) / (session.soldSeats + sessionFailedCount) * 100).toFixed(2)
      : '0.00'

    return {
      sessionId: session.id,
      sessionName: session.name,
      totalSeats: session.totalSeats,
      soldSeats: session.soldSeats,
      checkedIn: successCount,
      failedCount: sessionFailedCount,
      attendanceRate: parseFloat(attendanceRateBefore),
      adjustedAttendanceRate: parseFloat(adjustedRate),
      attendanceRateDelta: parseFloat((parseFloat(adjustedRate) - parseFloat(attendanceRateBefore)).toFixed(2))
    }
  })

  res.json({
    code: 0,
    data: {
      event: {
        id: event.id,
        name: event.name,
        venue: event.venue,
        startTime: event.startTime,
        endTime: event.endTime
      },
      totalOrders: event._count.orders,
      totalRevenue,
      totalFeedbacks: event._count.feedbacks,
      avgRating: parseFloat(avgRating),
      sessionStats: checkInStats,
      feedbacks,
      revenueLogs,
      failedCheckIns
    }
  })
})

export default router
