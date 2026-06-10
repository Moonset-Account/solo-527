const express = require('express')
const prisma = require('../prisma')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const clinics = await prisma.clinic.findMany({
      include: {
        _count: {
          select: { doctors: true, patients: true },
        },
      },
    })
    res.json(clinics)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        doctors: true,
        patients: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' })
    }
    res.json(clinic)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const clinic = await prisma.clinic.create({
      data: req.body,
    })
    res.status(201).json(clinic)
  } catch (err) {
    next(err)
  }
})

module.exports = router
