const express = require('express')
const prisma = require('../prisma')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const { name, phone, clinicId, page = 1, pageSize = 20 } = req.query
    const skip = (page - 1) * pageSize

    const where = {}
    if (name) where.name = { contains: name }
    if (phone) where.phone = { contains: phone }
    if (clinicId) where.clinicId = parseInt(clinicId)

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { appointments: true },
          },
        },
      }),
      prisma.patient.count({ where }),
    ])

    res.json({
      list: patients,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        clinic: true,
        appointments: {
          take: 10,
          orderBy: { appointDate: 'desc' },
          include: {
            doctor: true,
            medicalRecord: true,
          },
        },
        records: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          where: { status: { not: 'completed' } },
          orderBy: { planDate: 'asc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    res.json(patient)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const patient = await prisma.patient.create({
      data: req.body,
    })
    res.status(201).json(patient)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const patient = await prisma.patient.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    })
    res.json(patient)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/history', async (req, res, next) => {
  try {
    const history = await prisma.patientStatusHistory.findMany({
      where: { patientId: parseInt(req.params.id) },
      orderBy: { createdAt: 'desc' },
    })
    res.json(history)
  } catch (err) {
    next(err)
  }
})

module.exports = router
