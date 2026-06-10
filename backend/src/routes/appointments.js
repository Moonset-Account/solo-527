const express = require('express')
const dayjs = require('dayjs')
const prisma = require('../prisma')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const {
      patientId,
      doctorId,
      clinicId,
      status,
      startDate,
      endDate,
      isReturnVisit,
      page = 1,
      pageSize = 20,
    } = req.query

    const skip = (page - 1) * pageSize
    const where = {}

    if (patientId) where.patientId = parseInt(patientId)
    if (doctorId) where.doctorId = parseInt(doctorId)
    if (clinicId) where.clinicId = parseInt(clinicId)
    if (status) where.status = status
    if (isReturnVisit !== undefined) where.isReturnVisit = isReturnVisit === 'true'

    if (startDate || endDate) {
      where.appointDate = {}
      if (startDate) where.appointDate.gte = new Date(startDate)
      if (endDate) where.appointDate.lte = new Date(endDate)
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(pageSize),
        include: {
          patient: true,
          doctor: true,
          clinic: true,
          timeSlot: true,
          medicalRecord: true,
        },
        orderBy: { appointDate: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ])

    res.json({
      list: appointments,
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
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        patient: {
          include: {
            records: { take: 3, orderBy: { createdAt: 'desc' } },
            followUps: {
              where: { status: { not: 'completed' } },
              take: 3,
              orderBy: { planDate: 'asc' },
            },
          },
        },
        doctor: true,
        clinic: true,
        schedule: true,
        timeSlot: true,
        medicalRecord: true,
        followUp: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        operationLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }
    res.json(appointment)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const {
      patientId,
      doctorId,
      clinicId,
      scheduleId,
      timeSlotId,
      appointDate,
      startTime,
      endTime,
      chiefComplaint,
      source,
      remark,
      operatorName,
    } = req.body

    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    const prevAppointments = await prisma.appointment.count({
      where: { patientId, status: { in: ['confirmed', 'completed'] } },
    })
    const isReturnVisit = prevAppointments > 0

    if (timeSlotId) {
      const slot = await prisma.timeSlot.findUnique({
        where: { id: timeSlotId },
        include: { schedule: true },
      })
      if (!slot || slot.bookedCount >= slot.maxPatients) {
        return res.status(400).json({ error: '该号源已约满' })
      }

      await prisma.timeSlot.update({
        where: { id: timeSlotId },
        data: {
          bookedCount: { increment: 1 },
          status: slot.bookedCount + 1 >= slot.maxPatients ? 'booked' : slot.status,
          statusHistory: {
            create: {
              fromStatus: slot.status,
              toStatus: slot.bookedCount + 1 >= slot.maxPatients ? 'booked' : slot.status,
              remark: '预约挂号',
              operatorName: operatorName || '系统',
            },
          },
        },
      })

      await prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          bookedSlots: { increment: 1 },
        },
      })
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        clinicId,
        scheduleId,
        timeSlotId: timeSlotId || null,
        appointDate: new Date(appointDate),
        startTime,
        endTime,
        chiefComplaint,
        status: 'pending',
        source: source || '线下',
        isReturnVisit,
        remark,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'pending',
            remark: '创建预约',
            operatorName: operatorName || '系统',
          },
        },
        operationLogs: {
          create: {
            operation: 'create',
            fieldName: 'status',
            oldValue: null,
            newValue: 'pending',
            operatorName: operatorName || '系统',
          },
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
    })

    res.status(201).json(appointment)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const appointmentId = parseInt(req.params.id)
    const { status, remark, operatorName, chiefComplaint, source, isReturnVisit: returnVisitFlag } = req.body

    const oldAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!oldAppointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    const updateData = {}
    if (chiefComplaint !== undefined) updateData.chiefComplaint = chiefComplaint
    if (source !== undefined) updateData.source = source
    if (returnVisitFlag !== undefined) updateData.isReturnVisit = returnVisitFlag

    if (status && status !== oldAppointment.status) {
      updateData.status = status
      updateData.statusHistory = {
        create: {
          fromStatus: oldAppointment.status,
          toStatus: status,
          remark: remark || `状态变更为: ${status}`,
          operatorName: operatorName || '系统',
        },
      }
      updateData.operationLogs = {
        create: {
          operation: 'status_change',
          oldValue: oldAppointment.status,
          newValue: status,
          fieldName: 'status',
          operatorName: operatorName || '系统',
        },
      }

      if (status === 'cancelled' && oldAppointment.timeSlotId) {
        const slot = await prisma.timeSlot.findUnique({
          where: { id: oldAppointment.timeSlotId },
        })
        if (slot) {
          await prisma.timeSlot.update({
            where: { id: oldAppointment.timeSlotId },
            data: {
              bookedCount: { decrement: 1 },
              status: 'available',
              statusHistory: {
                create: {
                  fromStatus: slot.status,
                  toStatus: 'available',
                  remark: '取消预约，号源释放',
                  operatorName: operatorName || '系统',
                },
              },
            },
          })
          await prisma.schedule.update({
            where: { id: oldAppointment.scheduleId },
            data: {
              bookedSlots: { decrement: 1 },
              status: 'active',
            },
          })
        }
      }

      if (status === 'confirmed' && oldAppointment.status === 'pending') {
        updateData.operationLogs.create = [
          updateData.operationLogs.create,
          {
            operation: 'confirm',
            fieldName: 'status',
            oldValue: oldAppointment.status,
            newValue: 'confirmed',
            operatorName: operatorName || '系统',
          },
        ]
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
      },
    })

    res.json(appointment)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/history', async (req, res, next) => {
  try {
    const history = await prisma.appointmentStatusHistory.findMany({
      where: { appointmentId: parseInt(req.params.id) },
      orderBy: { createdAt: 'desc' },
    })
    res.json(history)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/operations', async (req, res, next) => {
  try {
    const logs = await prisma.appointmentOperationLog.findMany({
      where: { appointmentId: parseInt(req.params.id) },
      orderBy: { createdAt: 'desc' },
    })
    res.json(logs)
  } catch (err) {
    next(err)
  }
})

module.exports = router
