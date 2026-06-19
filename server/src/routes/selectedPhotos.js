const express = require('express')
const router = express.Router()
const prisma = require('../prisma')

router.get('/', async (req, res, next) => {
  try {
    const { orderId, isSelected } = req.query
    const where = {}
    if (orderId) where.orderId = Number(orderId)
    if (isSelected !== undefined) where.isSelected = isSelected === 'true'

    const list = await prisma.selectedPhoto.findMany({
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
    const photos = await prisma.selectedPhoto.createMany({
      data: req.body.photos
    })
    res.status(201).json(photos)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const data = { ...req.body }
    if (data.isSelected && !data.selectedAt) {
      data.selectedAt = new Date()
    }
    const photo = await prisma.selectedPhoto.update({
      where: { id: Number(req.params.id) },
      data
    })
    res.json(photo)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.selectedPhoto.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
