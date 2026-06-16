import { Router } from 'express'
import prisma from '../prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const generateOrderNo = () => {
  const date = new Date()
  const timestamp = date.getTime().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD${timestamp}${random}`
}

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, pageSize = 10, status, eventId, keyword } = req.query
  const where = {}
  if (status) where.status = status
  if (eventId) where.eventId = parseInt(eventId)
  if (keyword) {
    where.OR = [
      { orderNo: { contains: keyword } },
      { sourceOrder: { contains: keyword } }
    ]
  }
  if (req.user.role === 'ORGANIZER') {
    where.userId = req.user.id
  }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { name: true } },
        items: true,
        user: { select: { name: true } }
      }
    }),
    prisma.order.count({ where })
  ])
  res.json({ code: 0, data: { list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/:id', authMiddleware, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      event: true,
      items: { include: { session: true, seat: true } },
      checkIns: true,
      refunds: true
    }
  })
  res.json({ code: 0, data: order })
})

router.post('/', authMiddleware, async (req, res) => {
  const { eventId, items, sourceOrder, remark } = req.body
  const orderNo = generateOrderNo()

  let totalAmount = 0
  const orderItems = []

  for (const item of items) {
    const ticket = await prisma.ticket.findUnique({ where: { id: item.ticketId } })
    const price = ticket.price
    const amount = price.mul(item.quantity)
    totalAmount += parseFloat(amount)

    if (item.seatId) {
      const seat = await prisma.seat.findUnique({ where: { id: item.seatId } })
      if (seat.status !== 'AVAILABLE') {
        return res.json({ code: 1, message: '座位已被占用' })
      }
      await prisma.seat.update({
        where: { id: item.seatId },
        data: { status: 'SOLD' }
      })
    }

    orderItems.push({
      ticketId: item.ticketId,
      sessionId: item.sessionId,
      seatId: item.seatId,
      seatName: item.seatName,
      ticketName: ticket.name,
      price: price,
      quantity: item.quantity
    })

    await prisma.ticket.update({
      where: { id: item.ticketId },
      data: { sold: { increment: item.quantity } }
    })
  }

  const order = await prisma.order.create({
    data: {
      orderNo,
      userId: req.user.id,
      eventId,
      totalAmount,
      status: 'PAID',
      sourceOrder,
      remark,
      paidAt: new Date(),
      items: { create: orderItems }
    },
    include: { items: true }
  })

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  const totalRevenue = await prisma.revenueLog.aggregate({
    where: { eventId },
    _sum: { amount: true }
  })
  const currentBalance = parseFloat(totalRevenue._sum.amount || 0) + totalAmount

  await prisma.revenueLog.create({
    data: {
      eventId,
      orderId: order.id,
      type: 'SALE',
      amount: totalAmount,
      balance: currentBalance,
      description: `订单 ${orderNo} 购票收入`,
      sourceOrder,
      operatorId: req.user.id
    }
  })

  res.json({ code: 0, data: order })
})

router.post('/:id/refund', authMiddleware, async (req, res) => {
  const orderId = parseInt(req.params.id)
  const { orderItemId, reason } = req.body

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return res.json({ code: 1, message: '订单不存在' })

  let refundAmount = 0
  if (orderItemId) {
    const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } })
    refundAmount = parseFloat(item.price) * item.quantity
    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: 'REFUNDED' }
    })
    if (item.seatId) {
      await prisma.seat.update({
        where: { id: item.seatId },
        data: { status: 'AVAILABLE' }
      })
    }
  } else {
    refundAmount = parseFloat(order.totalAmount)
    const items = await prisma.orderItem.findMany({ where: { orderId } })
    for (const item of items) {
      if (item.seatId) {
        await prisma.seat.update({
          where: { id: item.seatId },
          data: { status: 'AVAILABLE' }
        })
      }
    }
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: { status: 'REFUNDED' }
    })
  }

  const refund = await prisma.refund.create({
    data: {
      orderId,
      orderItemId,
      userId: req.user.id,
      amount: refundAmount,
      status: 'COMPLETED',
      reason,
      sourceOrder: order.sourceOrder
    }
  })

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'REFUNDED' }
  })

  const totalRevenue = await prisma.revenueLog.aggregate({
    where: { eventId: order.eventId },
    _sum: { amount: true }
  })
  const currentBalance = parseFloat(totalRevenue._sum.amount || 0) - refundAmount

  await prisma.revenueLog.create({
    data: {
      eventId: order.eventId,
      orderId,
      type: 'REFUND',
      amount: -refundAmount,
      balance: currentBalance,
      description: `订单 ${order.orderNo} 退款`,
      sourceOrder: order.sourceOrder,
      operatorId: req.user.id
    }
  })

  res.json({ code: 0, data: refund })
})

export default router
