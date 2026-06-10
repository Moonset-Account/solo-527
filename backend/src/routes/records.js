const express = require('express')
const { prisma, refreshReturnVisitStatsForDate } = require('../prisma')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const { patientId, doctorId, page = 1, pageSize = 20 } = req.query
    const skip = (page - 1) * pageSize
    const where = {}
    if (patientId) where.patientId = parseInt(patientId)
    if (doctorId) where.doctorId = parseInt(doctorId)

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(pageSize),
        include: {
          patient: true,
          doctor: true,
          appointment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.medicalRecord.count({ where }),
    ])

    res.json({ list: records, total, page: parseInt(page), pageSize: parseInt(pageSize) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' })
    }
    res.json(record)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { appointmentId, patientId, doctorId, diagnosis, treatment, summary, prescription, cost, operatorName } = req.body

    const oldAppt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    const record = await prisma.medicalRecord.create({
      data: {
        appointmentId,
        patientId,
        doctorId,
        diagnosis,
        treatment,
        summary,
        prescription,
        cost: cost ? parseFloat(cost) : null,
        statusHistory: {
          create: {
            status: 'draft',
            remark: '创建病历',
            operatorName: operatorName || '系统',
          },
        },
      },
    })

    if (oldAppt && oldAppt.status !== 'completed') {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'completed',
          statusHistory: {
            create: {
              fromStatus: oldAppt.status,
              toStatus: 'completed',
              remark: '就诊完成，病历已填写',
              operatorName: operatorName || '系统',
            },
          },
          operationLogs: {
            create: {
              operation: 'complete',
              fieldName: 'status',
              oldValue: oldAppt.status,
              newValue: 'completed',
              operatorName: operatorName || '系统',
            },
          },
        },
      })

      try {
        await refreshReturnVisitStatsForDate(oldAppt.appointDate, oldAppt.clinicId, oldAppt.doctorId)
      } catch (e) {
      }
    }

    res.status(201).json(record)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const recordId = parseInt(req.params.id)
    const { operatorName, diagnosis, treatment, summary, prescription, cost } = req.body

    const updateData = {}
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis
    if (treatment !== undefined) updateData.treatment = treatment
    if (summary !== undefined) updateData.summary = summary
    if (prescription !== undefined) updateData.prescription = prescription
    if (cost !== undefined) updateData.cost = cost ? parseFloat(cost) : null

    const record = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        ...updateData,
        statusHistory: {
          create: {
            status: 'revised',
            remark: '更新病历',
            operatorName: operatorName || '系统',
          },
        },
      },
    })

    res.json(record)
  } catch (err) {
    next(err)
  }
})

module.exports = router
