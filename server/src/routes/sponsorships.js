const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, brandId, status, sponsorshipType } = req.query
    const skip = (page - 1) * pageSize
    const where = {}
    if (keyword) where.title = { contains: keyword }
    if (brandId) where.brandId = Number(brandId)
    if (status) where.status = status
    if (sponsorshipType) where.sponsorshipType = sponsorshipType

    const [list, total] = await Promise.all([
      prisma.sponsorship.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { id: true, name: true } }
        }
      }),
      prisma.sponsorship.count({ where })
    ])
    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const sponsorship = await prisma.sponsorship.findUnique({
      where: { id: Number(req.params.id) },
      include: { brand: true }
    })
    if (!sponsorship) return res.status(404).json({ error: 'Sponsorship not found' })
    res.json(sponsorship)
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
    const sponsorship = await prisma.sponsorship.create({ data })
    res.status(201).json(sponsorship)
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
    const sponsorship = await prisma.sponsorship.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(sponsorship)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.sponsorship.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
