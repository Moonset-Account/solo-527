const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { orderId, isDownloaded } = req.query
    const where = {}
    if (orderId) where.orderId = Number(orderId)
    if (isDownloaded !== undefined) where.isDownloaded = isDownloaded === 'true'

    const list = await prisma.finalPhoto.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    res.json({ list })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const photos = await prisma.finalPhoto.createMany({
      data: req.body.photos
    })
    res.status(201).json(photos)
  } catch (err) {
    next(err)
  }
})

router.post('/:id/download', async (req, res, next) => {
  try {
    const photo = await prisma.finalPhoto.update({
      where: { id: Number(req.params.id) },
      data: { isDownloaded: true, downloadedAt: new Date() }
    })
    res.json(photo)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const photo = await prisma.finalPhoto.update({
      where: { id: Number(req.params.id) },
      data: req.body
    })
    res.json(photo)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.finalPhoto.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
