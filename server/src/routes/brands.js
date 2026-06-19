const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, level, industry } = req.query
    const skip = (page - 1) * pageSize
    const where = {}
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { contactPerson: { contains: keyword } },
        { phone: { contains: keyword } }
      ]
    }
    if (level) where.level = level
    if (industry) where.industry = industry

    const [list, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true, contracts: true }
          }
        }
      }),
      prisma.brand.count({ where })
    ])
    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        orders: { take: 5, orderBy: { createdAt: 'desc' } },
        brandQuotes: { take: 5, orderBy: { createdAt: 'desc' } },
        contracts: { take: 5, orderBy: { createdAt: 'desc' } },
        sponsorships: { take: 5, orderBy: { createdAt: 'desc' } }
      }
    })
    if (!brand) return res.status(404).json({ error: 'Brand not found' })
    res.json(brand)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const brand = await prisma.brand.create({ data: req.body })
    res.status(201).json(brand)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const brand = await prisma.brand.update({
      where: { id: Number(req.params.id) },
      data: req.body
    })
    res.json(brand)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.brand.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
