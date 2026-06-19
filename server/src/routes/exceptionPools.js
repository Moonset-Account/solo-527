const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, priority, exceptionType, brandConfirmed, orderId, brandId } = req.query
    const skip = (page - 1) * pageSize
    const where = {}
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } }
      ]
    }
    if (status) where.status = status
    if (priority) where.priority = priority
    if (exceptionType) where.exceptionType = exceptionType
    if (brandConfirmed !== undefined) where.brandConfirmed = brandConfirmed === 'true'
    if (orderId) where.orderId = Number(orderId)
    if (brandId) where.brandId = Number(brandId)

    const [list, total] = await Promise.all([
      prisma.exceptionPool.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, title: true, orderNo: true } },
          brand: { select: { id: true, name: true } }
        }
      }),
      prisma.exceptionPool.count({ where })
    ])
    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const exception = await prisma.exceptionPool.findUnique({
      where: { id: Number(req.params.id) },
      include: { order: true, brand: true }
    })
    if (!exception) return res.status(404).json({ error: 'Exception not found' })
    res.json(exception)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const exception = await prisma.exceptionPool.create({ data: req.body })
    res.status(201).json(exception)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.status === 'HANDLED' && !data.handledAt) {
      data.handledAt = new Date()
    }
    const exception = await prisma.exceptionPool.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(exception)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/illustrator-conclusion', async (req, res, next) => {
  try {
    const { conclusion, illustratorId } = req.body
    const exception = await prisma.exceptionPool.update({
      where: { id: Number(req.params.id) },
      data: {
        illustratorConclusion: conclusion,
        illustratorId: illustratorId ? Number(illustratorId) : null,
        status: 'ILLUSTRATOR_HANDLED'
      }
    })
    res.json(exception)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/brand-confirm', async (req, res, next) => {
  try {
    const exception = await prisma.exceptionPool.update({
      where: { id: Number(req.params.id) },
      data: {
        brandConfirmed: true
      }
    })
    res.json(exception)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.exceptionPool.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
