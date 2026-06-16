import { Router } from 'express'
import prisma from '../prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, pageSize = 10, isRead, type } = req.query
  const where = { userId: req.user.id }
  if (isRead !== undefined) where.isRead = isRead === 'true'
  if (type) where.type = type

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
  ])

  res.json({ code: 0, data: { list: notifications, total, unreadCount, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/unread/count', authMiddleware, async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false }
  })
  res.json({ code: 0, data: count })
})

router.post('/read-all', authMiddleware, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true }
  })
  res.json({ code: 0 })
})

router.post('/:id/read', authMiddleware, async (req, res) => {
  const notification = await prisma.notification.update({
    where: { id: parseInt(req.params.id) },
    data: { isRead: true }
  })
  res.json({ code: 0, data: notification })
})

export default router
