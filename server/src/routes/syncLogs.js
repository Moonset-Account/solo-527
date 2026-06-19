const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, syncType, status } = req.query
    const skip = (page - 1) * pageSize
    const where = {}
    if (syncType) where.syncType = syncType
    if (status) where.status = status

    const [list, total] = await Promise.all([
      prisma.syncLog.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { syncTime: 'desc' }
      }),
      prisma.syncLog.count({ where })
    ])
    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const log = await prisma.syncLog.create({ data: req.body })
    res.status(201).json(log)
  } catch (err) {
    next(err)
  }
})

module.exports = router
