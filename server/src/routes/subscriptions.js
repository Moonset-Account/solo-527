const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { memberId, status, planType } = req.query
    const where = {}
    if (memberId) where.memberId = Number(memberId)
    if (status) where.status = status
    if (planType) where.planType = planType

    const list = await prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        member: { select: { id: true, name: true, phone: true } }
      }
    })
    res.json({ list })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: Number(req.params.id) },
      include: { member: true }
    })
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' })
    res.json(subscription)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    if (data.amount) data.amount = Number(data.amount)
    const subscription = await prisma.subscription.create({ data })
    res.status(201).json(subscription)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/renew', async (req, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: Number(req.params.id) }
    })
    if (!sub) return res.status(404).json({ error: 'Subscription not found' })
    
    const newEndDate = new Date(sub.endDate || sub.startDate || new Date())
    if (sub.planType === 'MONTHLY') {
      newEndDate.setMonth(newEndDate.getMonth() + 1)
    } else if (sub.planType === 'QUARTERLY') {
      newEndDate.setMonth(newEndDate.getMonth() + 3)
    } else if (sub.planType === 'YEARLY') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1)
    }

    const updated = await prisma.subscription.update({
      where: { id: Number(req.params.id) },
      data: {
        endDate: newEndDate,
        renewalCount: sub.renewalCount + 1,
        status: 'ACTIVE'
      }
    })

    const member = await prisma.member.findUnique({
      where: { id: sub.memberId }
    })
    if (member) {
      const days = Math.ceil((newEndDate - new Date()) / (1000 * 60 * 60 * 24))
      await prisma.member.update({
        where: { id: sub.memberId },
        data: {
          retentionDays: Math.max(member.retentionDays, days),
          lastActiveDate: new Date(),
          totalSpent: Number(member.totalSpent) + Number(sub.amount)
        }
      })
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    if (data.amount) data.amount = Number(data.amount)
    const subscription = await prisma.subscription.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(subscription)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.subscription.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
