import { Router } from 'express'
import prisma from '../prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, pageSize = 10, status, eventId, keyword } = req.query
  const where = {}
  if (status) where.status = status
  if (eventId) where.eventId = parseInt(eventId)
  if (keyword) {
    where.OR = [
      { checkInCode: { contains: keyword } },
      { sourceOrder: { contains: keyword } }
    ]
  }
  const [checkIns, total] = await Promise.all([
    prisma.checkIn.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNo: true, sourceOrder: true } },
        event: { select: { name: true } },
        session: { select: { name: true } },
        user: { select: { name: true } },
        orderItem: { select: { ticketName: true, seatName: true } }
      }
    }),
    prisma.checkIn.count({ where })
  ])
  res.json({ code: 0, data: { list: checkIns, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.post('/:orderItemId', authMiddleware, async (req, res) => {
  const orderItemId = parseInt(req.params.orderItemId)
  const { handleRemark } = req.body

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: true }
  })

  if (!orderItem) {
    return res.json({ code: 1, message: '票券不存在' })
  }

  const existingCheckIn = await prisma.checkIn.findFirst({
    where: {
      orderItemId,
      status: 'SUCCESS'
    }
  })

  if (existingCheckIn) {
    const failedCheckIn = await prisma.checkIn.create({
      data: {
        orderId: orderItem.orderId,
        orderItemId,
        eventId: orderItem.order.eventId,
        sessionId: orderItem.sessionId,
        userId: orderItem.order.userId,
        operatorId: req.user.id,
        status: 'FAILED',
        failureReason: '已核销，重复签到',
        handleRemark,
        sourceOrder: orderItem.order.sourceOrder
      }
    })

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'CHECKIN_FAILED',
        title: '核销失败提醒',
        content: `订单 ${orderItem.order.orderNo} 核销失败：已核销，重复签到`,
        relatedType: 'CHECKIN',
        relatedId: failedCheckIn.id
      }
    })

    await prisma.todo.create({
      data: {
        userId: req.user.id,
        title: `处理核销失败 - ${orderItem.order.orderNo}`,
        description: `核销失败原因：已核销，重复签到\n处理备注：${handleRemark || '无'}`,
        status: 'PENDING',
        priority: 'HIGH',
        relatedType: 'CHECKIN',
        relatedId: failedCheckIn.id
      }
    })

    return res.json({ code: 1, message: '已核销，重复签到', data: failedCheckIn })
  }

  if (orderItem.status !== 'VALID') {
    const failedCheckIn = await prisma.checkIn.create({
      data: {
        orderId: orderItem.orderId,
        orderItemId,
        eventId: orderItem.order.eventId,
        sessionId: orderItem.sessionId,
        userId: orderItem.order.userId,
        operatorId: req.user.id,
        status: 'FAILED',
        failureReason: `票券状态异常：${orderItem.status}`,
        handleRemark,
        sourceOrder: orderItem.order.sourceOrder
      }
    })

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'CHECKIN_FAILED',
        title: '核销失败提醒',
        content: `订单 ${orderItem.order.orderNo} 核销失败：票券状态异常`,
        relatedType: 'CHECKIN',
        relatedId: failedCheckIn.id
      }
    })

    return res.json({ code: 1, message: '票券状态异常', data: failedCheckIn })
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      orderId: orderItem.orderId,
      orderItemId,
      eventId: orderItem.order.eventId,
      sessionId: orderItem.sessionId,
      userId: orderItem.order.userId,
      operatorId: req.user.id,
      status: 'SUCCESS',
      checkedInAt: new Date(),
      handleRemark,
      sourceOrder: orderItem.order.sourceOrder
    }
  })

  if (orderItem.sessionId) {
    await prisma.session.update({
      where: { id: orderItem.sessionId },
      data: { checkedIn: { increment: 1 } }
    })
  }

  res.json({ code: 0, data: checkIn })
})

router.get('/stats/by-event/:eventId', authMiddleware, async (req, res) => {
  const eventId = parseInt(req.params.eventId)
  const sessions = await prisma.session.findMany({
    where: { eventId },
    orderBy: { startTime: 'asc' }
  })

  const stats = await Promise.all(sessions.map(async (session) => {
    const successCount = await prisma.checkIn.count({
      where: { sessionId: session.id, status: 'SUCCESS' }
    })
    const failedCount = await prisma.checkIn.count({
      where: { sessionId: session.id, status: 'FAILED' }
    })
    const attendanceRate = session.soldSeats > 0
      ? (successCount / session.soldSeats * 100).toFixed(2)
      : '0.00'

    return {
      sessionId: session.id,
      sessionName: session.name,
      totalSeats: session.totalSeats,
      soldSeats: session.soldSeats,
      checkedIn: successCount,
      failed: failedCount,
      attendanceRate: parseFloat(attendanceRate)
    }
  }))

  res.json({ code: 0, data: stats })
})

export default router
