import { Router, type Request, type Response } from 'express'
import Appointment from '../models/Appointment.js'
import Schedule from '../models/Schedule.js'
import Service from '../models/Service.js'
import Closure from '../models/Closure.js'
import { cacheGet, cacheSet } from '../db/redis.js'

const router = Router()

router.get('/schedule', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: 'startDate and endDate are required' })
      return
    }

    const cacheKey = `review:schedule:${startDate}:${endDate}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) })
      return
    }

    const schedules = await Schedule.find({
      date: { $gte: startDate as string, $lte: endDate as string },
    })
      .populate('doctorId', 'name title department')
      .populate('timeSlotId', 'startTime endTime label')
      .sort({ date: 1 })

    await cacheSet(cacheKey, JSON.stringify(schedules), 120)
    res.json({ success: true, data: schedules })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/no-show', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: 'startDate and endDate are required' })
      return
    }

    const dateFilter = { $gte: startDate as string, $lte: endDate as string }

    const [totalAppointments, noShowAppointments] = await Promise.all([
      Appointment.countDocuments({ date: dateFilter }),
      Appointment.find({ date: dateFilter, status: 'no_show' }).select('noShowReason'),
    ])

    const noShowRate = totalAppointments > 0 ? (noShowAppointments.length / totalAppointments) * 100 : 0

    const noShowReasons: Record<string, number> = {}
    for (const apt of noShowAppointments) {
      const reason = apt.noShowReason || '未注明'
      noShowReasons[reason] = (noShowReasons[reason] || 0) + 1
    }

    const noShowReasonsList = Object.entries(noShowReasons).map(([reason, count]) => ({ reason, count }))

    res.json({
      success: true,
      data: {
        totalAppointments,
        noShowCount: noShowAppointments.length,
        noShowRate: Math.round(noShowRate * 100) / 100,
        noShowReasons: noShowReasonsList,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/services', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: 'startDate and endDate are required' })
      return
    }

    const appointments = await Appointment.find({
      date: { $gte: startDate as string, $lte: endDate as string },
    }).populate('serviceId', 'name')

    const serviceMap: Record<string, { serviceName: string; count: number }> = {}
    for (const apt of appointments) {
      const svc = apt.serviceId as any
      const serviceId = svc?._id?.toString() || 'unknown'
      const serviceName = svc?.name || '未知服务'
      if (!serviceMap[serviceId]) {
        serviceMap[serviceId] = { serviceName, count: 0 }
      }
      serviceMap[serviceId].count++
    }

    const serviceDistribution = Object.entries(serviceMap).map(([serviceId, data]) => ({
      serviceId,
      serviceName: data.serviceName,
      count: data.count,
    }))

    res.json({ success: true, data: serviceDistribution })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: 'startDate and endDate are required' })
      return
    }

    const cacheKey = `review:stats:${startDate}:${endDate}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) })
      return
    }

    const dateFilter = { $gte: startDate as string, $lte: endDate as string }

    const [appointments, closureCount] = await Promise.all([
      Appointment.find({ date: dateFilter }).select('status'),
      Closure.countDocuments({ date: dateFilter }),
    ])

    const totalAppointments = appointments.length
    const arrivedCount = appointments.filter((a) => ['arrived', 'completed'].includes(a.status)).length
    const completedCount = appointments.filter((a) => a.status === 'completed').length
    const noShowCount = appointments.filter((a) => a.status === 'no_show').length
    const arrivalRate = totalAppointments > 0 ? (arrivedCount / totalAppointments) * 100 : 0

    const lastAppointment = await Appointment.findOne({ date: dateFilter }).sort({ updatedAt: -1 })
    const lastChangeAt = lastAppointment?.updatedAt?.toISOString() || ''

    const data = {
      totalAppointments,
      arrivedCount,
      completedCount,
      noShowCount,
      arrivalRate: Math.round(arrivalRate * 100) / 100,
      closureCount,
      lastChangeAt,
    }

    await cacheSet(cacheKey, JSON.stringify(data), 120)
    res.json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
