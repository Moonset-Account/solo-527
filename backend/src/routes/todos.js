import { Router } from 'express'
import prisma from '../prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, pageSize = 10, status, priority, keyword } = req.query
  const where = { userId: req.user.id }
  if (status) where.status = status
  if (priority) where.priority = priority
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { description: { contains: keyword } }
    ]
  }

  const now = new Date()
  await prisma.todo.updateMany({
    where: {
      userId: req.user.id,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      dueDate: { lt: now },
      isOverdue: false
    },
    data: { isOverdue: true, status: 'OVERDUE' }
  })

  const [todos, total] = await Promise.all([
    prisma.todo.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    }),
    prisma.todo.count({ where })
  ])

  const stats = {
    total,
    pending: await prisma.todo.count({ where: { userId: req.user.id, status: 'PENDING' } }),
    inProgress: await prisma.todo.count({ where: { userId: req.user.id, status: 'IN_PROGRESS' } }),
    overdue: await prisma.todo.count({ where: { userId: req.user.id, status: 'OVERDUE' } }),
    done: await prisma.todo.count({ where: { userId: req.user.id, status: 'DONE' } })
  }

  res.json({ code: 0, data: { list: todos, total: stats.total, stats, page: parseInt(page), pageSize: parseInt(pageSize) } })
})

router.get('/stats', authMiddleware, async (req, res) => {
  const now = new Date()
  await prisma.todo.updateMany({
    where: {
      userId: req.user.id,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      dueDate: { lt: now },
      isOverdue: false
    },
    data: { isOverdue: true, status: 'OVERDUE' }
  })

  const stats = {
    total: await prisma.todo.count({ where: { userId: req.user.id } }),
    pending: await prisma.todo.count({ where: { userId: req.user.id, status: 'PENDING' } }),
    inProgress: await prisma.todo.count({ where: { userId: req.user.id, status: 'IN_PROGRESS' } }),
    overdue: await prisma.todo.count({ where: { userId: req.user.id, status: 'OVERDUE' } }),
    done: await prisma.todo.count({ where: { userId: req.user.id, status: 'DONE' } })
  }

  res.json({ code: 0, data: stats })
})

router.post('/', authMiddleware, async (req, res) => {
  const todo = await prisma.todo.create({
    data: {
      ...req.body,
      userId: req.user.id
    }
  })
  res.json({ code: 0, data: todo })
})

router.put('/:id', authMiddleware, async (req, res) => {
  const todo = await prisma.todo.update({
    where: { id: parseInt(req.params.id) },
    data: req.body
  })
  res.json({ code: 0, data: todo })
})

router.delete('/:id', authMiddleware, async (req, res) => {
  await prisma.todo.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ code: 0 })
})

export default router
