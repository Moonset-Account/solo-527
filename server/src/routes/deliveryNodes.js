const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { orderId, status, nodeType } = req.query
    const where = {}
    if (orderId) where.orderId = Number(orderId)
    if (status) where.status = status
    if (nodeType) where.nodeType = nodeType

    const list = await prisma.deliveryNode.findMany({
      where,
      orderBy: { plannedDate: 'asc' },
      include: {
        order: { select: { id: true, title: true, orderNo: true } }
      }
    })
    res.json({ list })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const node = await prisma.deliveryNode.findUnique({
      where: { id: Number(req.params.id) },
      include: { order: true }
    })
    if (!node) return res.status(404).json({ error: 'Delivery node not found' })
    res.json(node)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.plannedDate) data.plannedDate = new Date(data.plannedDate)
    if (data.actualDate) data.actualDate = new Date(data.actualDate)
    const node = await prisma.deliveryNode.create({ data })
    res.status(201).json(node)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.plannedDate) data.plannedDate = new Date(data.plannedDate)
    if (data.actualDate) data.actualDate = new Date(data.actualDate)
    const node = await prisma.deliveryNode.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(node)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.deliveryNode.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
