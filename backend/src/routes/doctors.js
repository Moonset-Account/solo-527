const express = require('express')
const prisma = require('../prisma')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const { clinicId, specialty, name } = req.query
    const where = {}
    if (clinicId) where.clinicId = parseInt(clinicId)
    if (specialty) where.specialty = specialty
    if (name) where.name = { contains: name }
    where.status = true

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        clinic: true,
        _count: {
          select: { appointments: true, schedules: true },
        },
      },
      orderBy: { id: 'asc' },
    })
    res.json(doctors)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        clinic: true,
        schedules: {
          take: 20,
          orderBy: { date: 'desc' },
        },
      },
    })
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' })
    }
    res.json(doctor)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.create({
      data: req.body,
    })
    res.status(201).json(doctor)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    })
    res.json(doctor)
  } catch (err) {
    next(err)
  }
})

module.exports = router
