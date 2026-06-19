const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

function generateOrderNo() {
  const date = new Date()
  const prefix = 'ORD' + date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0') + 
    date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return prefix + random
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, brandId, orderType } = req.query
    const skip = (page - 1) * pageSize
    const where = {}
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { orderNo: { contains: keyword } }
      ]
    }
    if (status) where.status = status
    if (brandId) where.brandId = Number(brandId)
    if (orderType) where.orderType = orderType

    const [list, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { id: true, name: true } },
          _count: {
            select: { schedules: true, deliveryNodes: true, payments: true }
          }
        }
      }),
      prisma.order.count({ where })
    ])
    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        brand: true,
        schedules: { orderBy: { startTime: 'asc' } },
        deliveryNodes: { orderBy: { plannedDate: 'asc' } },
        contracts: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        workAuthorizations: { orderBy: { createdAt: 'desc' } },
        selectedPhotos: { orderBy: { createdAt: 'desc' } },
        finalPhotos: { orderBy: { createdAt: 'desc' } }
      }
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (!data.orderNo) data.orderNo = generateOrderNo()
    const order = await prisma.order.create({ data })
    res.status(201).json(order)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: req.body
    })
    res.json(order)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.order.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/confirm-selection', async (req, res, next) => {
  try {
    const { photoIds } = req.body
    await prisma.selectedPhoto.updateMany({
      where: { orderId: Number(req.params.id), id: { in: photoIds } },
      data: { isSelected: true, selectedAt: new Date() }
    })
    await prisma.selectedPhoto.updateMany({
      where: { orderId: Number(req.params.id), id: { notIn: photoIds } },
      data: { isSelected: false, selectedAt: null }
    })
    await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { clientConfirm: true }
    })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/final-delivery', async (req, res, next) => {
  try {
    await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { finalDelivery: true }
    })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
