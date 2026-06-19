const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { orderId, status, startDate, endDate } = req.query
    const where = {}
    if (orderId) where.orderId = Number(orderId)
    if (status) where.status = status
    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) where.startTime.gte = new Date(startDate)
      if (endDate) where.startTime.lte = new Date(endDate)
    }

    const list = await prisma.schedule.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        order: { select: { id: true, title: true, orderNo: true, brand: { select: { name: true } } } }
      }
    })
    res.json({ list })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: Number(req.params.id) },
      include: { order: true }
    })
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' })
    res.json(schedule)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.startTime) data.startTime = new Date(data.startTime)
    if (data.endTime) data.endTime = new Date(data.endTime)
    const schedule = await prisma.schedule.create({ data })
    res.status(201).json(schedule)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.startTime) data.startTime = new Date(data.startTime)
    if (data.endTime) data.endTime = new Date(data.endTime)
    const schedule = await prisma.schedule.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(schedule)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.schedule.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
