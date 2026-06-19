const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

function generatePaymentNo() {
  const date = new Date()
  const prefix = 'PAY' + date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return prefix + random
}

router.get('/', async (req, res, next) => {
  try {
    const { orderId, status, paymentMethod } = req.query
    const where = {}
    if (orderId) where.orderId = Number(orderId)
    if (status) where.status = status
    if (paymentMethod) where.paymentMethod = paymentMethod

    const list = await prisma.payment.findMany({
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
    const payment = await prisma.payment.findUnique({
      where: { id: Number(req.params.id) },
      include: { order: true }
    })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    res.json(payment)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (!data.paymentNo) data.paymentNo = generatePaymentNo()
    if (data.paymentDate) data.paymentDate = new Date(data.paymentDate)
    if (data.amount) data.amount = Number(data.amount)
    const payment = await prisma.payment.create({ data })
    
    if (data.status === 'PAID') {
      const order = await prisma.order.findUnique({ where: { id: data.orderId } })
      if (order) {
        const payments = await prisma.payment.findMany({
          where: { orderId: data.orderId, status: 'PAID' }
        })
        const totalPaid = payments.reduce((sum, p) => sum.add(p.amount), require('@prisma/client').Prisma.Decimal(0))
        await prisma.order.update({
          where: { id: data.orderId },
          data: { paidAmount: totalPaid.add(data.amount) }
        })
      }
    }
    
    res.status(201).json(payment)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.paymentDate) data.paymentDate = new Date(data.paymentDate)
    if (data.amount) data.amount = Number(data.amount)
    const payment = await prisma.payment.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(payment)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.payment.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
