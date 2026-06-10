const express = require('express')
const prisma = require('../prisma')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const { status, clinicId } = req.query
    const where = {}
    if (status) where.status = status
    if (clinicId) {
      where.timeSlot = {
        schedule: {
          clinicId: parseInt(clinicId),
        },
      }
    }

    const conflicts = await prisma.slotConflict.findMany({
      where,
      include: {
        timeSlot: {
          include: {
            schedule: {
              include: {
                doctor: true,
                clinic: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(conflicts)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const conflict = await prisma.slotConflict.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        timeSlot: {
          include: {
            schedule: {
              include: {
                doctor: true,
                clinic: true,
              },
            },
            appointments: {
              include: {
                patient: true,
              },
            },
          },
        },
      },
    })
    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' })
    }
    res.json(conflict)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { timeSlotId, conflictType, description, involvedAppointments } = req.body

    const conflict = await prisma.slotConflict.create({
      data: {
        timeSlotId,
        conflictType,
        description,
        involvedAppointments: involvedAppointments || [],
      },
    })

    res.status(201).json(conflict)
  } catch (err) {
    next(err)
  }
})

router.put('/:id/resolve', async (req, res, next) => {
  try {
    const conflictId = parseInt(req.params.id)
    const { resolutionNote, resolverName, action, appointmentIdsToCancel } = req.body

    const conflict = await prisma.slotConflict.findUnique({
      where: { id: conflictId },
      include: {
        timeSlot: true,
      },
    })

    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' })
    }

    if (action === 'cancel' && appointmentIdsToCancel?.length > 0) {
      for (const apptId of appointmentIdsToCancel) {
        await prisma.appointment.update({
          where: { id: apptId },
          data: {
            status: 'cancelled',
            statusHistory: {
              create: {
                fromStatus: 'confirmed',
                toStatus: 'cancelled',
                remark: `号源冲突处理: ${resolutionNote || '调整号源'}`,
                operatorName: resolverName || '负责人',
              },
            },
          },
        })
      }
    }

    const updatedConflict = await prisma.slotConflict.update({
      where: { id: conflictId },
      data: {
        status: 'resolved',
        resolutionNote,
        resolverName,
        resolvedAt: new Date(),
      },
    })

    res.json(updatedConflict)
  } catch (err) {
    next(err)
  }
})

router.put('/:id/dismiss', async (req, res, next) => {
  try {
    const conflictId = parseInt(req.params.id)
    const { resolutionNote, resolverName } = req.body

    const updatedConflict = await prisma.slotConflict.update({
      where: { id: conflictId },
      data: {
        status: 'dismissed',
        resolutionNote: resolutionNote || '无需处理',
        resolverName,
        resolvedAt: new Date(),
      },
    })

    res.json(updatedConflict)
  } catch (err) {
    next(err)
  }
})

module.exports = router
