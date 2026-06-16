import { Router } from 'express'
import prisma from '../prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, pageSize = 10, status, eventId, keyword } = req.query
  const where = {}
  if (status) where.status = status
  if (eventId) {
    where.order = { eventId: parseInt(eventId) }
  }
  if (keyword) {
    where.sourceOrder = { contains: keyword }
  }

  const [refunds, total] = await Promise.all([
    prisma.refund.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            event: { select: { name: true } }
          }
        },
        user: { select: { name: true } }
      }
    }),
    prisma.refund.count({ where })
  ])
  res.json({ code: 0, data: { list: refunds, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/pending/count', authMiddleware, async (req, res) => {
  const count = await prisma.refund.count({ where: { status: 'PENDING' } })
  res.json({ code: 0, data: count })
})

router.post('/:id/approve', authMiddleware, async (req, res) => {
  const { handleRemark } = req.body
  const refund = await prisma.refund.update({
    where: { id: parseInt(req.params.id) },
    data: {
      status: 'APPROVED',
      operatorId: req.user.id,
      handleRemark
    },
    include: { order: true }
  })

  await prisma.order.update({
    where: { id: refund.orderId },
    data: { status: 'REFUNDING' }
  })

  res.json({ code: 0, data: refund })
})

router.post('/:id/reject', authMiddleware, async (req, res) => {
  const { handleRemark } = req.body
  const refund = await prisma.refund.update({
    where: { id: parseInt(req.params.id) },
    data: {
      status: 'REJECTED',
      operatorId: req.user.id,
      handleRemark
    }
  })
  res.json({ code: 0, data: refund })
})

export default router
