const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { orderId, status, authType } = req.query
    const where = {}
    if (orderId) where.orderId = Number(orderId)
    if (status) where.status = status
    if (authType) where.authType = authType

    const list = await prisma.workAuthorization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    const auth = await prisma.workAuthorization.findUnique({
      where: { id: Number(req.params.id) },
      include: { order: true }
    })
    if (!auth) return res.status(404).json({ error: 'Work authorization not found' })
    res.json(auth)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    if (data.fee) data.fee = Number(data.fee)
    const auth = await prisma.workAuthorization.create({ data })
    res.status(201).json(auth)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    if (data.fee) data.fee = Number(data.fee)
    const auth = await prisma.workAuthorization.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(auth)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.workAuthorization.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
