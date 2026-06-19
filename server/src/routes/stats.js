const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/overview', async (req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      totalBrands,
      totalRevenue,
      pendingPayments,
      activeMembers,
      activeSubscriptions,
      pendingExceptions,
      totalSchedules
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.brand.count(),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true }
      }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.exceptionPool.count({ where: { status: 'PENDING' } }),
      prisma.schedule.count()
    ])

    res.json({
      totalOrders,
      pendingOrders,
      totalBrands,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingPayments,
      activeMembers,
      activeSubscriptions,
      pendingExceptions,
      totalSchedules
    })
  } catch (err) {
    next(err)
  }
})

router.get('/order-status', async (req, res, next) => {
  try {
    const statuses = ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'CANCELLED']
    const counts = await Promise.all(
      statuses.map(status => prisma.order.count({ where: { status } }))
    )
    const data = statuses.map((status, i) => ({ status, count: counts[i] }))
    res.json({ list: data })
  } catch (err) {
    next(err)
  }
})

router.get('/retention-stats', async (req, res, next) => {
  try {
    const members = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      select: { retentionDays: true, totalSpent: true }
    })
    
    const retentionRanges = [
      { label: '0-30天', min: 0, max: 30 },
      { label: '31-90天', min: 31, max: 90 },
      { label: '91-180天', min: 91, max: 180 },
      { label: '180天以上', min: 181, max: 99999 }
    ]

    const data = retentionRanges.map(range => ({
      label: range.label,
      count: members.filter(m => m.retentionDays >= range.min && m.retentionDays <= range.max).length
    }))

    res.json({ list: data, totalMembers: members.length })
  } catch (err) {
    next(err)
  }
})

router.get('/recent-activities', async (req, res, next) => {
  try {
    const [orders, payments, exceptions] = await Promise.all([
      prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { brand: { select: { name: true } } } }),
      prisma.payment.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { order: { select: { title: true } } } }),
      prisma.exceptionPool.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { brand: { select: { name: true } } } })
    ])
    
    res.json({
      recentOrders: orders,
      recentPayments: payments,
      recentExceptions: exceptions
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
