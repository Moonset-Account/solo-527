const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, level, status } = req.query
    const skip = (page - 1) * pageSize
    const where = {}
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { phone: { contains: keyword } },
        { email: { contains: keyword } }
      ]
    }
    if (level) where.level = level
    if (status) where.status = status

    const [list, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { subscriptions: true }
          }
        }
      }),
      prisma.member.count({ where })
    ])
    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' } }
      }
    })
    if (!member) return res.status(404).json({ error: 'Member not found' })
    res.json(member)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.totalSpent) data.totalSpent = Number(data.totalSpent)
    const member = await prisma.member.create({ data })
    res.status(201).json(member)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.totalSpent) data.totalSpent = Number(data.totalSpent)
    const member = await prisma.member.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(member)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.member.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
