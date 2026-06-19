const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

function generateQuoteNo() {
  const date = new Date()
  const prefix = 'BQ' + date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return prefix + random
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, brandId, status, serviceType } = req.query
    const skip = (page - 1) * pageSize
    const where = {}
    if (keyword) where.title = { contains: keyword }
    if (brandId) where.brandId = Number(brandId)
    if (status) where.status = status
    if (serviceType) where.serviceType = serviceType

    const [list, total] = await Promise.all([
      prisma.brandQuote.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { id: true, name: true } }
        }
      }),
      prisma.brandQuote.count({ where })
    ])
    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const quote = await prisma.brandQuote.findUnique({
      where: { id: Number(req.params.id) },
      include: { brand: true }
    })
    if (!quote) return res.status(404).json({ error: 'Quote not found' })
    res.json(quote)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (!data.quoteNo) data.quoteNo = generateQuoteNo()
    if (data.validFrom) data.validFrom = new Date(data.validFrom)
    if (data.validTo) data.validTo = new Date(data.validTo)
    if (data.amount) data.amount = Number(data.amount)
    const quote = await prisma.brandQuote.create({ data })
    res.status(201).json(quote)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.validFrom) data.validFrom = new Date(data.validFrom)
    if (data.validTo) data.validTo = new Date(data.validTo)
    if (data.amount) data.amount = Number(data.amount)
    const quote = await prisma.brandQuote.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(quote)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.brandQuote.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
