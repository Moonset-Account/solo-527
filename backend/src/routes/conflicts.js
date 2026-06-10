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
        timeSlot: {
          include: {
            schedule: true,
            appointments: true,
          },
        },
      },
    })

    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' })
    }

    const changedSlotIds = new Set()
    const changedScheduleIds = new Set()
    const validCancelIds = []

    if (action === 'cancel' && appointmentIdsToCancel?.length > 0) {
      for (const apptId of appointmentIdsToCancel) {
        const oldAppt = await prisma.appointment.findUnique({
          where: { id: apptId },
        })

        if (oldAppt && oldAppt.status !== 'cancelled') {
          await prisma.appointment.update({
            where: { id: apptId },
            data: {
              status: 'cancelled',
              statusHistory: {
                create: {
                  fromStatus: oldAppt.status,
                  toStatus: 'cancelled',
                  remark: `号源冲突处理: ${resolutionNote || '调整号源'}`,
                  operatorName: resolverName || '负责人',
                },
              },
              operationLogs: {
                create: {
                  operation: 'conflict_cancel',
                  fieldName: 'status',
                  oldValue: oldAppt.status,
                  newValue: 'cancelled',
                  operatorName: resolverName || '负责人',
                },
              },
            },
          })

          if (oldAppt.timeSlotId) changedSlotIds.add(oldAppt.timeSlotId)
          if (oldAppt.scheduleId) changedScheduleIds.add(oldAppt.scheduleId)
          validCancelIds.push(apptId)
        }
      }

      for (const slotId of changedSlotIds) {
        const slot = await prisma.timeSlot.findUnique({
          where: { id: slotId },
        })
        if (!slot) continue

        const remainingApptCount = await prisma.appointment.count({
          where: {
            timeSlotId: slotId,
            status: { in: ['pending', 'confirmed', 'completed'] },
          },
        })

        const maxPatients = slot.maxPatients || 1
        let newSlotStatus = slot.status
        if (remainingApptCount === 0) {
          newSlotStatus = 'available'
        } else if (remainingApptCount >= maxPatients) {
          newSlotStatus = 'booked'
        } else {
          newSlotStatus = 'available'
        }

        if (slot.bookedCount !== remainingApptCount || slot.status !== newSlotStatus) {
          await prisma.timeSlot.update({
            where: { id: slotId },
            data: {
              bookedCount: remainingApptCount,
              status: newSlotStatus,
              statusHistory: {
                create:
                  slot.status !== newSlotStatus
                    ? {
                        fromStatus: slot.status,
                        toStatus: newSlotStatus,
                        remark: `号源冲突处理释放 ${validCancelIds.length} 个预约，剩余活跃预约: ${remainingApptCount}`,
                        operatorName: resolverName || '负责人',
                      }
                    : undefined,
              },
            },
          })
        }
      }

      for (const scheduleId of changedScheduleIds) {
        const schedule = await prisma.schedule.findUnique({
          where: { id: scheduleId },
        })
        if (!schedule) continue

        const remainingScheduleApptCount = await prisma.appointment.count({
          where: {
            scheduleId,
            status: { in: ['pending', 'confirmed', 'completed'] },
          },
        })

        let newScheduleStatus = schedule.status
        if (remainingScheduleApptCount === 0) {
          newScheduleStatus = 'active'
        }

        if (
          schedule.bookedSlots !== remainingScheduleApptCount ||
          schedule.status !== newScheduleStatus
        ) {
          await prisma.schedule.update({
            where: { id: scheduleId },
            data: {
              bookedSlots: remainingScheduleApptCount,
              status: newScheduleStatus,
              statusHistory: {
                create:
                  schedule.status !== newScheduleStatus
                    ? {
                        fromStatus: schedule.status,
                        toStatus: newScheduleStatus,
                        remark: `号源冲突处理后排班状态调整，剩余预约: ${remainingScheduleApptCount}`,
                        operatorName: resolverName || '负责人',
                      }
                    : undefined,
              },
            },
          })
        }
      }
    }

    const updatedConflict = await prisma.slotConflict.update({
      where: { id: conflictId },
      data: {
        status: 'resolved',
        resolutionNote,
        resolverName,
        resolvedAt: new Date(),
        involvedAppointments: action === 'cancel' ? validCancelIds : undefined,
      },
    })

    res.json({
      ...updatedConflict,
      syncStats: {
        cancelledAppointments: validCancelIds.length,
        updatedTimeSlots: changedSlotIds.size,
        updatedSchedules: changedScheduleIds.size,
        note: '复诊率统计将自动按最新预约状态聚合计算',
      },
    })
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
