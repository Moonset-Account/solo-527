import { Router } from 'express'
import prisma from '../prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, pageSize = 10, eventId, feedbackType, rating } = req.query
  const where = {}
  if (eventId) where.eventId = parseInt(eventId)
  if (feedbackType) where.feedbackType = feedbackType
  if (rating) where.rating = parseInt(rating)

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { name: true } },
        order: { select: { orderNo: true, sourceOrder: true } },
        user: { select: { name: true } }
      }
    }),
    prisma.feedback.count({ where })
  ])
  res.json({ code: 0, data: { list: feedbacks, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.post('/', authMiddleware, async (req, res) => {
  const { eventId, orderId, rating, content, feedbackType, handleRemark } = req.body

  const order = await prisma.order.findUnique({ where: { id: orderId } })

  const feedback = await prisma.feedback.create({
    data: {
      eventId,
      orderId,
      userId: req.user.id,
      rating,
      content,
      feedbackType,
      handleRemark,
      sourceOrder: order?.sourceOrder
    }
  })
  res.json({ code: 0, data: feedback })
})

router.put('/:id', authMiddleware, async (req, res) => {
  const feedback = await prisma.feedback.update({
    where: { id: parseInt(req.params.id) },
    data: { handleRemark: req.body.handleRemark }
  })
  res.json({ code: 0, data: feedback })
})

export default router
