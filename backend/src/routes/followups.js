const express = require('express')
const prisma = require('../prisma')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const { patientId, doctorId, status, page = 1, pageSize = 20 } = req.query
    const skip = (page - 1) * pageSize
    const where = {}
    if (patientId) where.patientId = parseInt(patientId)
    if (doctorId) where.doctorId = parseInt(doctorId)
    if (status) where.status = status

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(pageSize),
        include: {
          patient: true,
          doctor: true,
          appointment: true,
        },
        orderBy: { planDate: 'asc' },
      }),
      prisma.followUp.count({ where }),
    ])

    res.json({ list: followUps, total, page: parseInt(page), pageSize: parseInt(pageSize) })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const followUp = await prisma.followUp.findUnique({
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
    if (!followUp) {
      return res.status(404).json({ error: 'Follow-up not found' })
    }
    res.json(followUp)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentId, type, content, planDate, operatorName } = req.body

    const followUp = await prisma.followUp.create({
      data: {
        patientId,
        doctorId: doctorId || null,
        appointmentId: appointmentId || null,
        type,
        content,
        planDate: new Date(planDate),
        status: 'pending',
        operatorName: operatorName || null,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'pending',
            remark: '创建随访任务',
            operatorName: operatorName || '系统',
          },
        },
      },
    })

    res.status(201).json(followUp)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const followUpId = parseInt(req.params.id)
    const { status, result, actualDate, remark, operatorName, type, content, planDate } = req.body

    const oldFollowUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
    })

    if (!oldFollowUp) {
      return res.status(404).json({ error: 'Follow-up not found' })
    }

    const updateData = {}
    if (type !== undefined) updateData.type = type
    if (content !== undefined) updateData.content = content
    if (planDate !== undefined) updateData.planDate = new Date(planDate)
    if (result !== undefined) updateData.result = result
    if (actualDate !== undefined) updateData.actualDate = actualDate ? new Date(actualDate) : null

    if (status && status !== oldFollowUp.status) {
      updateData.status = status
      updateData.statusHistory = {
        create: {
          fromStatus: oldFollowUp.status,
          toStatus: status,
          remark: remark || `状态变更为: ${status}`,
          operatorName: operatorName || '系统',
        },
      }
    }

    const followUp = await prisma.followUp.update({
      where: { id: followUpId },
      data: updateData,
    })

    res.json(followUp)
  } catch (err) {
    next(err)
  }
})

module.exports = router
