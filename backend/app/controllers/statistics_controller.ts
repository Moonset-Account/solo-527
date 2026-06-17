import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderEvaluation from '#models/order_evaluation'
import AttendanceRecord from '#models/attendance_record'
import Technician from '#models/technician'
import {
  technicianLoadValidator,
  repurchaseStatsValidator,
  lateReasonStatsValidator,
} from '#validators/statistics'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class StatisticsController {
  async technicianLoad({ request, response }: HttpContext) {
    const { startDate, endDate, period = 'day', technicianId } = await request.validateUsing(technicianLoadValidator)

    const start = startDate
      ? DateTime.fromJSDate(startDate).startOf('day')
      : DateTime.now().minus({ days: 30 }).startOf('day')

    const end = endDate
      ? DateTime.fromJSDate(endDate).endOf('day')
      : DateTime.now().endOf('day')

    const query = Order.query()
      .where('isDemo', false)
      .where('status', '!=', 'cancelled')
      .where('appointmentTime', '>=', start.toJSDate())
      .where('appointmentTime', '<=', end.toJSDate())
      .whereNotNull('technicianId')

    if (technicianId) {
      query.where('technicianId', technicianId)
    }

    const orders = await query
      .preload('technician')
      .orderBy('appointmentTime', 'asc')

    const result: Record<string, any> = {}

    if (period === 'day') {
      let current = start
      while (current <= end) {
        const dateStr = current.toISODate()
        result[dateStr] = {
          totalOrders: 0,
          technicians: {} as Record<number, { name: string; count: number; dailyLimit: number }>,
        }
        current = current.plus({ days: 1 })
      }

      for (const order of orders) {
        const dateStr = order.appointmentTime.toISODate()
        if (result[dateStr] && order.technician) {
          result[dateStr].totalOrders++
          if (!result[dateStr].technicians[order.technicianId!]) {
            result[dateStr].technicians[order.technicianId!] = {
              name: order.technician.name,
              count: 0,
              dailyLimit: order.technician.dailyLimit,
            }
          }
          result[dateStr].technicians[order.technicianId!].count++
        }
      }
    } else if (period === 'week') {
      let current = start.startOf('week')
      const endWeek = end.endOf('week')
      while (current <= endWeek) {
        const weekKey = `${current.toISODate()}_${current.plus({ days: 6 }).toISODate()}`
        result[weekKey] = {
          totalOrders: 0,
          technicians: {} as Record<number, { name: string; count: number }>,
        }
        current = current.plus({ weeks: 1 })
      }

      for (const order of orders) {
        const orderWeekStart = order.appointmentTime.startOf('week')
        const weekKey = `${orderWeekStart.toISODate()}_${orderWeekStart.plus({ days: 6 }).toISODate()}`
        if (result[weekKey] && order.technician) {
          result[weekKey].totalOrders++
          if (!result[weekKey].technicians[order.technicianId!]) {
            result[weekKey].technicians[order.technicianId!] = {
              name: order.technician.name,
              count: 0,
            }
          }
          result[weekKey].technicians[order.technicianId!].count++
        }
      }
    } else if (period === 'month') {
      let current = start.startOf('month')
      const endMonth = end.endOf('month')
      while (current <= endMonth) {
        const monthKey = current.toFormat('yyyy-MM')
        result[monthKey] = {
          totalOrders: 0,
          technicians: {} as Record<number, { name: string; count: number }>,
        }
        current = current.plus({ months: 1 })
      }

      for (const order of orders) {
        const monthKey = order.appointmentTime.toFormat('yyyy-MM')
        if (result[monthKey] && order.technician) {
          result[monthKey].totalOrders++
          if (!result[monthKey].technicians[order.technicianId!]) {
            result[monthKey].technicians[order.technicianId!] = {
              name: order.technician.name,
              count: 0,
            }
          }
          result[monthKey].technicians[order.technicianId!].count++
        }
      }
    }

    return response.json({
      data: {
        period,
        dateRange: { start: start.toISODate(), end: end.toISODate() },
        result,
      },
    })
  }

  async repurchaseStats({ request, response }: HttpContext) {
    const { startDate, endDate, groupBy = 'date' } = await request.validateUsing(repurchaseStatsValidator)

    const start = startDate
      ? DateTime.fromJSDate(startDate).startOf('day')
      : DateTime.now().minus({ days: 30 }).startOf('day')

    const end = endDate
      ? DateTime.fromJSDate(endDate).endOf('day')
      : DateTime.now().endOf('day')

    const evaluations = await OrderEvaluation.query()
      .whereHas('order', (orderQuery) => {
        orderQuery
          .where('isDemo', false)
          .where('createdAt', '>=', start.toJSDate())
          .where('createdAt', '<=', end.toJSDate())
      })
      .preload('order')
      .orderBy('createdAt', 'asc')

    const result: Record<string, { total: number; repurchaseCount: number; repurchaseRate: number }> = {}
    let totalCount = 0
    let totalRepurchase = 0

    if (groupBy === 'date') {
      let current = start
      while (current <= end) {
        const dateStr = current.toISODate()
        result[dateStr] = { total: 0, repurchaseCount: 0, repurchaseRate: 0 }
        current = current.plus({ days: 1 })
      }

      for (const evalItem of evaluations) {
        const dateStr = evalItem.order.createdAt.toISODate()
        if (result[dateStr]) {
          result[dateStr].total++
          totalCount++
          if (evalItem.isRepurchase) {
            result[dateStr].repurchaseCount++
            totalRepurchase++
          }
        }
      }
    } else if (groupBy === 'channel') {
      for (const evalItem of evaluations) {
        const channel = evalItem.order.channel || '未标记渠道'
        if (!result[channel]) {
          result[channel] = { total: 0, repurchaseCount: 0, repurchaseRate: 0 }
        }
        result[channel].total++
        totalCount++
        if (evalItem.isRepurchase) {
          result[channel].repurchaseCount++
          totalRepurchase++
        }
      }
    } else if (groupBy === 'community') {
      const ordersWithCommunity = await Order.query()
        .where('isDemo', false)
        .where('createdAt', '>=', start.toJSDate())
        .where('createdAt', '<=', end.toJSDate())
        .whereNotNull('communityId')
        .preload('community')
        .preload('evaluation')

      for (const order of ordersWithCommunity) {
        const communityName = order.community?.name || '未归属社区'
        if (!result[communityName]) {
          result[communityName] = { total: 0, repurchaseCount: 0, repurchaseRate: 0 }
        }
        result[communityName].total++
        totalCount++
        if (order.evaluation?.isRepurchase) {
          result[communityName].repurchaseCount++
          totalRepurchase++
        }
      }
    }

    for (const key in result) {
      if (result[key].total > 0) {
        result[key].repurchaseRate = Math.round((result[key].repurchaseCount / result[key].total) * 10000) / 100
      }
    }

    return response.json({
      data: {
        groupBy,
        dateRange: { start: start.toISODate(), end: end.toISODate() },
        summary: {
          totalEvaluations: totalCount,
          totalRepurchase: totalRepurchase,
          overallRepurchaseRate: totalCount > 0 ? Math.round((totalRepurchase / totalCount) * 10000) / 100 : 0,
        },
        details: result,
      },
    })
  }

  async lateReasonStats({ request, response }: HttpContext) {
    const { startDate, endDate } = await request.validateUsing(lateReasonStatsValidator)

    const start = startDate
      ? DateTime.fromJSDate(startDate).startOf('day')
      : DateTime.now().minus({ days: 30 }).startOf('day')

    const end = endDate
      ? DateTime.fromJSDate(endDate).endOf('day')
      : DateTime.now().endOf('day')

    const records = await AttendanceRecord.query()
      .where('createdAt', '>=', start.toJSDate())
      .where('createdAt', '<=', end.toJSDate())
      .whereNotNull('actualArrivalTime')
      .preload('technician')
      .preload('order')

    const lateReasons: Record<string, { count: number; records: any[] }> = {}
    let totalRecords = 0
    let lateCount = 0

    for (const record of records) {
      totalRecords++
      const scheduled = record.scheduledTime
      const actual = record.actualArrivalTime!

      const isLate = actual > scheduled.plus({ minutes: 15 })

      if (isLate) {
        lateCount++
        const reason = record.lateReason || '未说明原因'
        if (!lateReasons[reason]) {
          lateReasons[reason] = { count: 0, records: [] }
        }
        lateReasons[reason].count++
        lateReasons[reason].records.push({
          id: record.id,
          technicianName: record.technician?.name,
          orderId: record.orderId,
          scheduledTime: scheduled,
          actualTime: actual,
        })
      }
    }

    const sortedReasons = Object.entries(lateReasons)
      .sort((a, b) => b[1].count - a[1].count)
      .reduce((acc, [reason, data]) => {
        acc[reason] = data
        return acc
      }, {} as Record<string, { count: number; records: any[] }>)

    return response.json({
      data: {
        dateRange: { start: start.toISODate(), end: end.toISODate() },
        summary: {
          totalRecords,
          lateCount,
          lateRate: totalRecords > 0 ? Math.round((lateCount / totalRecords) * 10000) / 100 : 0,
        },
        lateReasons: sortedReasons,
      },
    })
  }

  async overview({ response }: HttpContext) {
    const today = DateTime.now().startOf('day')
    const tomorrow = DateTime.now().plus({ days: 1 }).startOf('day')
    const thisMonth = DateTime.now().startOf('month')
    const nextMonth = DateTime.now().plus({ months: 1 }).startOf('month')

    const [
      pendingOrders,
      todayOrders,
      monthOrders,
      completedOrders,
      totalTechnicians,
      activeTechnicians,
    ] = await Promise.all([
      Order.query().where('status', 'pending').where('isDemo', false).count('* as total'),
      Order.query()
        .where('appointmentTime', '>=', today.toJSDate())
        .where('appointmentTime', '<', tomorrow.toJSDate())
        .where('isDemo', false)
        .count('* as total'),
      Order.query()
        .where('appointmentTime', '>=', thisMonth.toJSDate())
        .where('appointmentTime', '<', nextMonth.toJSDate())
        .where('isDemo', false)
        .count('* as total'),
      Order.query().where('status', 'completed').where('isDemo', false).count('* as total'),
      Technician.query().count('* as total'),
      Technician.query().where('status', 'active').count('* as total'),
    ])

    const getCount = (result: any[]) => parseInt(result[0].$extras.total, 10)

    return response.json({
      data: {
        pendingOrders: getCount(pendingOrders),
        todayOrders: getCount(todayOrders),
        monthOrders: getCount(monthOrders),
        completedOrders: getCount(completedOrders),
        totalTechnicians: getCount(totalTechnicians),
        activeTechnicians: getCount(activeTechnicians),
      },
    })
  }
}
