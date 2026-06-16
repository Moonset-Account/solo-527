import { Router } from 'express'
import prisma from '../prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, pageSize = 10, status, keyword } = req.query
  const where = {}
  if (status) where.status = status
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { venue: { contains: keyword } }
    ]
  }
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true, sessions: true } }
      }
    }),
    prisma.event.count({ where })
  ])
  res.json({ code: 0, data: { list: events, total, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/:id', authMiddleware, async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      sessions: { orderBy: { startTime: 'asc' } },
      tickets: true
    }
  })
  res.json({ code: 0, data: event })
})

router.get('/:id/seats', authMiddleware, async (req, res) => {
  const { sessionId } = req.query
  const seats = await prisma.seat.findMany({
    where: { sessionId: parseInt(sessionId) },
    orderBy: [{ row: 'asc' }, { number: 'asc' }]
  })
  res.json({ code: 0, data: seats })
})

router.post('/', authMiddleware, async (req, res) => {
  const data = req.body
  const event = await prisma.event.create({
    data: {
      ...data,
      organizerId: req.user.id
    }
  })
  res.json({ code: 0, data: event })
})

router.put('/:id', authMiddleware, async (req, res) => {
  const event = await prisma.event.update({
    where: { id: parseInt(req.params.id) },
    data: req.body
  })
  res.json({ code: 0, data: event })
})

export default router
