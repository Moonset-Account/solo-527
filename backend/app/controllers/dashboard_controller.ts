import Seat from '#models/seat'
import RenewalList from '#models/renewal_list'
import OperationLog from '#models/operation_log'
import DailyUsage from '#models/daily_usage'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class DashboardController {
  async stats({ request, auth }: HttpContext) {
    const today = DateTime.now().toISODate()

    const totalSeats = await Seat.query().count('* as total').first()

    const todayUsage = await DailyUsage.query()
      .where('statDate', today)
      .select(db.raw('COALESCE(SUM(total_calls), 0) as total_calls'))
      .first()

    const pendingRenewals = await RenewalList.query()
      .where('status', 'pending')
      .orWhere('status', 'following')
      .count('* as total')
      .first()

    const idleSeats = await Seat.query().where('isIdle', true).count('* as total').first()

    const activeSeats = await Seat.query().where('status', 'active').count('* as total').first()

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_dashboard_stats',
      resourceType: 'dashboard',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
    })

    return {
      totalSeats: Number(totalSeats?.$extras.total || 0),
      activeSeats: Number(activeSeats?.$extras.total || 0),
      todayCalls: Number(todayUsage?.$extras.total_calls || 0),
      pendingRenewals: Number(pendingRenewals?.$extras.total || 0),
      idleSeats: Number(idleSeats?.$extras.total || 0),
    }
  }

  async todos({ request, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const myRenewals = await RenewalList.query()
      .where('assignedTo', user.id)
      .where((q) => {
        q.where('status', 'pending').orWhere('status', 'following')
      })
      .preload('seat')
      .orderBy('priority', 'desc')
      .orderBy('nextFollowUpAt', 'asc')
      .limit(10)

    const upcomingFollowUps = await RenewalList.query()
      .whereNotNull('nextFollowUpAt')
      .where('nextFollowUpAt', '<=', DateTime.now().plus({ days: 3 }).toISO())
      .where((q) => {
        q.where('status', 'pending').orWhere('status', 'following')
      })
      .preload('assignedUser')
      .preload('seat')
      .orderBy('nextFollowUpAt', 'asc')
      .limit(10)

    const highPriorityRenewals = await RenewalList.query()
      .where('priority', 'urgent')
      .orWhere('priority', 'high')
      .where((q) => {
        q.where('status', 'pending').orWhere('status', 'following')
      })
      .preload('assignedUser')
      .preload('seat')
      .orderBy('expiryDate', 'asc')
      .limit(10)

    const expiringSeats = await Seat.query()
      .whereNotNull('endDate')
      .where('endDate', '<=', DateTime.now().plus({ days: 30 }).toISO())
      .where('status', '!=', 'cancelled')
      .preload('plan')
      .orderBy('endDate', 'asc')
      .limit(10)

    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_dashboard_todos',
      resourceType: 'dashboard',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
    })

    return {
      myRenewals: myRenewals.map((item) => ({
        id: item.id,
        customerId: item.customerId,
        customerName: item.customerName,
        planName: item.planName,
        expiryDate: item.expiryDate,
        status: item.status,
        priority: item.priority,
        nextFollowUpAt: item.nextFollowUpAt,
        seatId: item.seatId,
      })),
      upcomingFollowUps: upcomingFollowUps.map((item) => ({
        id: item.id,
        customerId: item.customerId,
        customerName: item.customerName,
        planName: item.planName,
        expiryDate: item.expiryDate,
        status: item.status,
        priority: item.priority,
        nextFollowUpAt: item.nextFollowUpAt,
        seatId: item.seatId,
        assignedTo: item.assignedUser
          ? {
              id: item.assignedUser.id,
              name: item.assignedUser.fullName || item.assignedUser.email,
            }
          : null,
      })),
      highPriorityRenewals: highPriorityRenewals.map((item) => ({
        id: item.id,
        customerId: item.customerId,
        customerName: item.customerName,
        planName: item.planName,
        expiryDate: item.expiryDate,
        status: item.status,
        priority: item.priority,
        seatId: item.seatId,
        assignedTo: item.assignedUser
          ? {
              id: item.assignedUser.id,
              name: item.assignedUser.fullName || item.assignedUser.email,
            }
          : null,
      })),
      expiringSeats: expiringSeats.map((seat) => {
        const endDate = seat.endDate ? DateTime.fromJSDate(seat.endDate.toJSDate()) : null
        const expireDays = endDate ? Math.ceil(endDate.diff(DateTime.now(), 'days').days) : 0
        return {
          id: seat.id,
          seatCode: seat.seatCode,
          customerId: seat.customerId,
          customerName: seat.customerName,
          planName: seat.plan?.name || '',
          endDate: seat.endDate,
          expireDays,
          status: seat.status,
        }
      }),
    }
  }

  async recentActivity({ request, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const limit = request.input('limit', 20)

    const recentLogs = await OperationLog.query()
      .whereNotNull('userId')
      .preload('user')
      .orderBy('createdAt', 'desc')
      .limit(limit)

    await OperationLog.create({
      userId: user.id,
      userName: user.fullName || user.email,
      action: 'view_dashboard_activity',
      resourceType: 'dashboard',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
    })

    return recentLogs.map((log) => ({
      id: log.id,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      userName: log.userName,
      user: log.user
        ? {
            id: log.user.id,
            name: log.user.fullName || log.user.email,
            email: log.user.email,
          }
        : null,
      details: log.details,
      createdAt: log.createdAt,
    }))
  }
}
