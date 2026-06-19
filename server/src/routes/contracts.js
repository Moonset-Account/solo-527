const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

function generateContractNo() {
  const date = new Date()
  const prefix = 'CT' + date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return prefix + random
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, keyword, brandId, orderId, status, contractType } = req.query
    const skip = (page - 1) * pageSize
    const where = {}
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { contractNo: { contains: keyword } }
      ]
    }
    if (brandId) where.brandId = Number(brandId)
    if (orderId) where.orderId = Number(orderId)
    if (status) where.status = status
    if (contractType) where.contractType = contractType

    const [list, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { id: true, name: true } },
          order: { select: { id: true, title: true, orderNo: true } }
        }
      }),
      prisma.contract.count({ where })
    ])
    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: Number(req.params.id) },
      include: { brand: true, order: true }
    })
    if (!contract) return res.status(404).json({ error: 'Contract not found' })
    res.json(contract)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (!data.contractNo) data.contractNo = generateContractNo()
    if (data.signDate) data.signDate = new Date(data.signDate)
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    if (data.amount) data.amount = Number(data.amount)
    const contract = await prisma.contract.create({ data })
    res.status(201).json(contract)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.signDate) data.signDate = new Date(data.signDate)
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    if (data.amount) data.amount = Number(data.amount)
    const contract = await prisma.contract.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(contract)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.contract.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
