const express = require('express')
const dayjs = require('dayjs')
const prisma = require('../prisma')

const router = express.Router()

function generateTimeSlots(startTime, endTime, slotDuration = 30) {
  const slots = []
  let current = dayjs(`2000-01-01 ${startTime}`)
  const end = dayjs(`2000-01-01 ${endTime}`)
  let index = 0

  while (current.isBefore(end)) {
    const slotEnd = current.add(slotDuration, 'minute')
    slots.push({
      startTime: current.format('HH:mm'),
      endTime: slotEnd.format('HH:mm'),
      slotIndex: index,
      status: 'available',
      maxPatients: 1,
      bookedCount: 0,
    })
    current = slotEnd
    index++
  }

  return slots
}

router.get('/', async (req, res, next) => {
  try {
    const { doctorId, clinicId, startDate, endDate } = req.query
    const where = {}

    if (doctorId) where.doctorId = parseInt(doctorId)
    if (clinicId) where.clinicId = parseInt(clinicId)
    if (startDate) {
      where.date = {
        gte: new Date(startDate),
      }
    }
    if (endDate) {
      where.date = {
        ...where.date,
        lte: new Date(endDate),
      }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        doctor: true,
        clinic: true,
        slots: {
          orderBy: { slotIndex: 'asc' },
        },
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: { date: 'asc' },
    })

    res.json(schedules)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        doctor: true,
        clinic: true,
        slots: {
          orderBy: { slotIndex: 'asc' },
          include: {
            appointments: {
              include: {
                patient: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }
    res.json(schedule)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { doctorId, clinicId, date, startTime, endTime, shiftType, slotDuration = 30, operatorName } = req.body

    const slots = generateTimeSlots(startTime, endTime, slotDuration)
    const totalSlots = slots.length

    const schedule = await prisma.schedule.create({
      data: {
        doctorId,
        clinicId,
        date: new Date(date),
        startTime,
        endTime,
        shiftType,
        totalSlots,
        bookedSlots: 0,
        status: 'active',
        slots: {
          create: slots,
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'active',
            remark: '创建排班',
            operatorName: operatorName || '系统',
          },
        },
      },
      include: {
        slots: true,
      },
    })

    res.status(201).json(schedule)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { status, remark, operatorName, startTime, endTime, shiftType, totalSlots } = req.body
    const scheduleId = parseInt(req.params.id)

    const oldSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    })

    if (!oldSchedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    const scheduleData = {}
    if (startTime !== undefined) scheduleData.startTime = startTime
    if (endTime !== undefined) scheduleData.endTime = endTime
    if (shiftType !== undefined) scheduleData.shiftType = shiftType
    if (totalSlots !== undefined) scheduleData.totalSlots = totalSlots
    if (status !== undefined) scheduleData.status = status

    if (status && status !== oldSchedule.status) {
      scheduleData.statusHistory = {
        create: {
          fromStatus: oldSchedule.status,
          toStatus: status,
          remark: remark || '更新排班状态',
          operatorName: operatorName || '系统',
        },
      }
    }

    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: scheduleData,
    })

    res.json(schedule)
  } catch (err) {
    next(err)
  }
})

router.post('/batch', async (req, res, next) => {
  try {
    const { doctorId, clinicId, dates, startTime, endTime, shiftType, slotDuration = 30, operatorName } = req.body

    const results = []
    for (const date of dates) {
      const slots = generateTimeSlots(startTime, endTime, slotDuration)
      const totalSlots = slots.length

      const schedule = await prisma.schedule.create({
        data: {
          doctorId,
          clinicId,
          date: new Date(date),
          startTime,
          endTime,
          shiftType,
          totalSlots,
          bookedSlots: 0,
          status: 'active',
          slots: {
            create: slots,
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: 'active',
              remark: '批量创建排班',
              operatorName: operatorName || '系统',
            },
          },
        },
      })
      results.push(schedule)
    }

    res.status(201).json(results)
  } catch (err) {
    next(err)
  }
})

router.put('/slots/:slotId', async (req, res, next) => {
  try {
    const { status, remark, operatorName, maxPatients } = req.body
    const slotId = parseInt(req.params.slotId)

    const oldSlot = await prisma.timeSlot.findUnique({
      where: { id: slotId },
    })

    if (!oldSlot) {
      return res.status(404).json({ error: 'Time slot not found' })
    }

    const slotData = {}
    if (maxPatients !== undefined) slotData.maxPatients = maxPatients
    if (status !== undefined) slotData.status = status

    if (status && status !== oldSlot.status) {
      slotData.statusHistory = {
        create: {
          fromStatus: oldSlot.status,
          toStatus: status,
          remark: remark || '更新号源状态',
          operatorName: operatorName || '系统',
        },
      }
    }

    const slot = await prisma.timeSlot.update({
      where: { id: slotId },
      data: slotData,
    })

    res.json(slot)
  } catch (err) {
    next(err)
  }
})

router.get('/slots/:slotId/history', async (req, res, next) => {
  try {
    const history = await prisma.timeSlotStatusHistory.findMany({
      where: { timeSlotId: parseInt(req.params.slotId) },
      orderBy: { createdAt: 'desc' },
    })
    res.json(history)
  } catch (err) {
    next(err)
  }
})

module.exports = router
