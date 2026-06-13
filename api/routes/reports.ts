import { Router, type Request, type Response, type NextFunction } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/overview', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const isAdmin = req.user!.role === 'admin'
    const userId = req.user!.id
    const storeId = req.user!.storeId

    const alertWhere: Record<string, unknown> = {}
    const requestWhere: Record<string, unknown> = {}
    const taskWhere: Record<string, unknown> = {}
    const recordWhere: Record<string, unknown> = { createdAt: { gte: weekAgo }, duration: { not: null } }
    const dutyWhere: Record<string, unknown> = { date: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } }

    if (!isAdmin) {
      alertWhere.OR = [{ dutyStaffId: userId }, { confirmedBy: userId }]
      requestWhere.OR = [{ applicantId: userId }, { dutyStaffId: userId }]
      taskWhere.assigneeId = userId
      recordWhere.operatorId = userId
      dutyWhere.staff = { storeId }
    }

    const [
      pendingAlerts,
      todayAlerts,
      pendingRequests,
      todayRequests,
      pendingTasks,
      totalTasks,
      todayDuty,
      pendingInspectionTasks,
      weeklyResponseStats,
    ] = await Promise.all([
      prisma.alert.count({ where: { ...alertWhere, status: 'pending' } }),
      prisma.alert.count({ where: { ...alertWhere, createdAt: { gte: today } } }),
      prisma.accountRequest.count({ where: { ...requestWhere, status: 'pending' } }),
      prisma.accountRequest.count({ where: { ...requestWhere, createdAt: { gte: today } } }),
      prisma.inspectionTask.count({ where: { ...taskWhere, status: 'pending' } }),
      prisma.inspectionTask.count({ where: taskWhere }),
      prisma.dutySchedule.findMany({
        where: dutyWhere,
        include: { staff: { select: { id: true, displayName: true } } },
      }),
      prisma.inspectionTask.count({ where: { ...taskWhere, status: 'pending', scheduledDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } } }),
      prisma.processRecord.findMany({
        where: recordWhere,
        select: { ticketType: true, action: true, duration: true, createdAt: true },
      }),
    ])

    const last7DaysResponse: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      last7DaysResponse[key] = 0
    }

    for (const rec of weeklyResponseStats) {
      const d = new Date(rec.createdAt)
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      if (last7DaysResponse[key] !== undefined && rec.duration) {
        last7DaysResponse[key] += rec.duration
      }
    }

    const responseTypesMap: Record<string, { total: number; count: number }> = {}
    for (const rec of weeklyResponseStats) {
      if (!rec.duration) continue
      if (!responseTypesMap[rec.ticketType]) {
        responseTypesMap[rec.ticketType] = { total: 0, count: 0 }
      }
      responseTypesMap[rec.ticketType].total += rec.duration
      responseTypesMap[rec.ticketType].count += 1
    }
    const avgByType: Record<string, number> = {}
    for (const key of Object.keys(responseTypesMap)) {
      avgByType[key] = responseTypesMap[key].count > 0
        ? Math.round(responseTypesMap[key].total / responseTypesMap[key].count)
        : 0
    }

    res.json({
      data: {
        pendingAlerts,
        todayAlerts,
        pendingRequests,
        todayRequests,
        pendingInspectionTasks,
        pendingTasks,
        totalTasks,
        todayDuty,
        pendingTodayTaskCount: pendingInspectionTasks,
        last7DaysResponse,
        avgByType,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/sla', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string

    const dateFilter: Record<string, unknown> = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      }
    }

    const [totalAlerts, confirmedAlerts, totalRequests, approvedRequests] = await Promise.all([
      prisma.alert.count({ where: dateFilter }),
      prisma.alert.count({ where: { ...dateFilter, status: { in: ['confirmed', 'resolved', 'escalated'] } } }),
      prisma.accountRequest.count({ where: dateFilter }),
      prisma.accountRequest.count({ where: { ...dateFilter, status: 'approved' } }),
    ])

    const alertRecords = await prisma.processRecord.findMany({
      where: {
        ticketType: 'alert',
        action: 'confirmed',
        duration: { not: null },
        ...(startDate || endDate ? { createdAt: dateFilter.createdAt } : {}),
      },
      select: { duration: true },
    })

    const requestRecords = await prisma.processRecord.findMany({
      where: {
        ticketType: 'account_request',
        action: { in: ['approved', 'rejected'] },
        duration: { not: null },
        ...(startDate || endDate ? { createdAt: dateFilter.createdAt } : {}),
      },
      select: { duration: true },
    })

    const avgAlertResponse = alertRecords.length > 0
      ? Math.round(alertRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / alertRecords.length)
      : 0

    const avgRequestResponse = requestRecords.length > 0
      ? Math.round(requestRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / requestRecords.length)
      : 0

    const slaTarget = 30
    const alertSlaMet = alertRecords.filter(r => (r.duration || 0) <= slaTarget).length
    const requestSlaMet = requestRecords.filter(r => (r.duration || 0) <= slaTarget).length

    res.json({
      data: {
        alert: {
          total: totalAlerts,
          confirmed: confirmedAlerts,
          confirmRate: totalAlerts > 0 ? Math.round((confirmedAlerts / totalAlerts) * 100) : 0,
          avgResponseMinutes: avgAlertResponse,
          slaRate: alertRecords.length > 0 ? Math.round((alertSlaMet / alertRecords.length) * 100) : 0,
        },
        accountRequest: {
          total: totalRequests,
          approved: approvedRequests,
          approvalRate: totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0,
          avgResponseMinutes: avgRequestResponse,
          slaRate: requestRecords.length > 0 ? Math.round((requestSlaMet / requestRecords.length) * 100) : 0,
        },
      },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/trend', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string
    const granularity = (req.query.granularity as string) || 'day'

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    const alerts = await prisma.alert.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { id: true, createdAt: true, level: true, status: true },
    })

    const requests = await prisma.accountRequest.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { id: true, createdAt: true, urgency: true, status: true },
    })

    const dateFormat = granularity === 'month'
      ? (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const alertTrend: Record<string, { total: number; byLevel: Record<string, number> }> = {}
    const requestTrend: Record<string, { total: number; byUrgency: Record<string, number> }> = {}

    for (const alert of alerts) {
      const key = dateFormat(alert.createdAt)
      if (!alertTrend[key]) alertTrend[key] = { total: 0, byLevel: {} }
      alertTrend[key].total++
      alertTrend[key].byLevel[alert.level] = (alertTrend[key].byLevel[alert.level] || 0) + 1
    }

    for (const request of requests) {
      const key = dateFormat(request.createdAt)
      if (!requestTrend[key]) requestTrend[key] = { total: 0, byUrgency: {} }
      requestTrend[key].total++
      requestTrend[key].byUrgency[request.urgency] = (requestTrend[key].byUrgency[request.urgency] || 0) + 1
    }

    res.json({
      data: {
        alertTrend,
        requestTrend,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
