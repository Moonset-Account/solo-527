const express = require('express')
const dayjs = require('dayjs')
const { prisma, refreshReturnVisitStatsForDate, upsertReturnVisitStats } = require('../prisma')

const router = express.Router()

router.get('/overview', async (req, res, next) => {
  try {
    const { clinicId, startDate, endDate } = req.query

    const where = {}
    if (clinicId) where.clinicId = parseInt(clinicId)
    if (startDate) where.appointDate = { ...where.appointDate, gte: new Date(startDate) }
    if (endDate) where.appointDate = { ...where.appointDate, lte: new Date(endDate) }

    const [totalAppointments, completedAppointments, cancelledAppointments, noShowAppointments, totalPatients, returnVisits] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({ where: { ...where, status: 'completed' } }),
      prisma.appointment.count({ where: { ...where, status: 'cancelled' } }),
      prisma.appointment.count({ where: { ...where, status: 'no_show' } }),
      prisma.patient.count({ where: clinicId ? { clinicId: parseInt(clinicId) } : {} }),
      prisma.appointment.count({ where: { ...where, isReturnVisit: true, status: 'completed' } }),
    ])

    const returnRate = completedAppointments > 0
      ? ((returnVisits / completedAppointments) * 100).toFixed(1)
      : 0

    res.json({
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      totalPatients,
      returnVisits,
      returnRate: parseFloat(returnRate),
    })
  } catch (err) {
    next(err)
  }
})

router.get('/return-visit', async (req, res, next) => {
  try {
    const { clinicId, doctorId, period = 'month', startDate, endDate, refresh } = req.query

    if (refresh === '1') {
      const today = new Date()
      await refreshReturnVisitStatsForDate(
        today,
        clinicId ? parseInt(clinicId) : undefined,
        doctorId ? parseInt(doctorId) : undefined
      )
    }

    const where = { periodType: period }
    if (clinicId) where.clinicId = parseInt(clinicId)
    if (doctorId) where.doctorId = parseInt(doctorId)
    if (startDate) where.periodStart = { ...where.periodStart, gte: dayjs(startDate).startOf(period).toDate() }
    if (endDate) where.periodStart = { ...where.periodStart, lte: dayjs(endDate).endOf(period).toDate() }

    let statsRecords = await prisma.returnVisitStats.findMany({
      where,
      orderBy: { periodStart: 'asc' },
    })

    if (statsRecords.length === 0) {
      const fallbackWhere = { status: 'completed' }
      if (clinicId) fallbackWhere.clinicId = parseInt(clinicId)
      if (doctorId) fallbackWhere.doctorId = parseInt(doctorId)
      if (startDate) fallbackWhere.appointDate = { ...fallbackWhere.appointDate, gte: new Date(startDate) }
      if (endDate) fallbackWhere.appointDate = { ...fallbackWhere.appointDate, lte: new Date(endDate) }

      const appointments = await prisma.appointment.findMany({
        where: fallbackWhere,
        select: {
          appointDate: true,
          isReturnVisit: true,
          doctorId: true,
          clinicId: true,
        },
        orderBy: { appointDate: 'asc' },
      })

      const statsByDate = {}
      for (const appt of appointments) {
        let key
        const date = dayjs(appt.appointDate)
        if (period === 'day') {
          key = date.format('YYYY-MM-DD')
        } else if (period === 'week') {
          key = date.startOf('week').format('YYYY-MM-DD')
        } else {
          key = date.format('YYYY-MM')
        }

        if (!statsByDate[key]) {
          statsByDate[key] = { total: 0, return: 0, dateObj: date.startOf(period).toDate() }
        }
        statsByDate[key].total++
        if (appt.isReturnVisit) statsByDate[key].return++
      }

      const records = Object.entries(statsByDate).map(([key, data]) => ({
        periodStart: data.dateObj,
        date: key,
        total: data.total,
        return: data.return,
        rate: data.total > 0 ? parseFloat(((data.return / data.total) * 100).toFixed(1)) : 0,
      }))

      for (const rec of records) {
        try {
          await upsertReturnVisitStats({
            periodType: period,
            periodStart: rec.periodStart,
            clinicId: clinicId ? parseInt(clinicId) : undefined,
            doctorId: doctorId ? parseInt(doctorId) : undefined,
          })
        } catch (e) {
        }
      }

      statsRecords = await prisma.returnVisitStats.findMany({
        where,
        orderBy: { periodStart: 'asc' },
      })
    }

    const chartData = statsRecords.map((r) => ({
      date: dayjs(r.periodStart).format(period === 'day' ? 'YYYY-MM-DD' : period === 'week' ? 'YYYY-MM-DD' : 'YYYY-MM'),
      total: r.totalVisits,
      return: r.returnVisits,
      rate: r.returnRate,
    }))

    res.json(chartData)
  } catch (err) {
    next(err)
  }
})

router.get('/slot-utilization', async (req, res, next) => {
  try {
    const { clinicId, doctorId, period = 'month', startDate, endDate } = req.query

    const scheduleWhere = {}
    if (clinicId) scheduleWhere.clinicId = parseInt(clinicId)
    if (doctorId) scheduleWhere.doctorId = parseInt(doctorId)
    if (startDate) scheduleWhere.date = { ...scheduleWhere.date, gte: new Date(startDate) }
    if (endDate) scheduleWhere.date = { ...scheduleWhere.date, lte: new Date(endDate) }

    const schedules = await prisma.schedule.findMany({
      where: scheduleWhere,
      include: {
        slots: {
          select: { status: true, bookedCount: true },
        },
      },
    })

    const statsByPeriod = {}

    for (const schedule of schedules) {
      let key
      const date = dayjs(schedule.date)
      if (period === 'day') {
        key = date.format('YYYY-MM-DD')
      } else if (period === 'week') {
        key = date.startOf('week').format('YYYY-MM-DD')
      } else {
        key = date.format('YYYY-MM')
      }

      if (!statsByPeriod[key]) {
        statsByPeriod[key] = { totalSlots: 0, bookedSlots: 0 }
      }

      statsByPeriod[key].totalSlots += schedule.totalSlots
      statsByPeriod[key].bookedSlots += schedule.bookedSlots
    }

    const chartData = Object.entries(statsByPeriod)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        totalSlots: data.totalSlots,
        bookedSlots: data.bookedSlots,
        utilizationRate: data.totalSlots > 0
          ? parseFloat(((data.bookedSlots / data.totalSlots) * 100).toFixed(1))
          : 0,
      }))

    res.json(chartData)
  } catch (err) {
    next(err)
  }
})

router.get('/doctors/ranking', async (req, res, next) => {
  try {
    const { clinicId, startDate, endDate, limit = 10 } = req.query

    const apptWhere = { status: 'completed' }
    if (clinicId) apptWhere.clinicId = parseInt(clinicId)
    if (startDate) apptWhere.appointDate = { ...apptWhere.appointDate, gte: new Date(startDate) }
    if (endDate) apptWhere.appointDate = { ...apptWhere.appointDate, lte: new Date(endDate) }

    const doctors = await prisma.doctor.findMany({
      where: {
        clinicId: clinicId ? parseInt(clinicId) : undefined,
        status: true,
      },
      include: {
        clinic: true,
        _count: {
          select: { appointments: true },
        },
      },
    })

    const doctorStats = await Promise.all(
      doctors.map(async (doctor) => {
        const completedCount = await prisma.appointment.count({
          where: {
            ...apptWhere,
            doctorId: doctor.id,
          },
        })

        const returnCount = await prisma.appointment.count({
          where: {
            ...apptWhere,
            doctorId: doctor.id,
            isReturnVisit: true,
          },
        })

        return {
          id: doctor.id,
          name: doctor.name,
          title: doctor.title,
          specialty: doctor.specialty,
          clinic: doctor.clinic?.name,
          totalAppointments: completedCount,
          returnVisits: returnCount,
          returnRate: completedCount > 0
            ? parseFloat(((returnCount / completedCount) * 100).toFixed(1))
            : 0,
        }
      })
    )

    doctorStats.sort((a, b) => b.totalAppointments - a.totalAppointments)

    res.json(doctorStats.slice(0, parseInt(limit)))
  } catch (err) {
    next(err)
  }
})

module.exports = router
