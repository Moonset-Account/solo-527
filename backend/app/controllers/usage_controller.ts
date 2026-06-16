import UsageRecord from '#models/usage_record'
import DailyUsage from '#models/daily_usage'
import Seat from '#models/seat'
import OperationLog from '#models/operation_log'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class UsageController {
  async trends({ request, auth }: HttpContext) {
    const { seatId, startDate, endDate, groupBy = 'day' } = request.qs()

    const start = startDate ? DateTime.fromISO(startDate) : DateTime.now().minus({ days: 30 })
    const end = endDate ? DateTime.fromISO(endDate) : DateTime.now()

    const query = DailyUsage.query()

    if (seatId) {
      query.where('seatId', seatId)
    }

    query.whereBetween('statDate', [start.toFormat('yyyy-MM-dd'), end.toFormat('yyyy-MM-dd')]).orderBy('statDate', 'asc')

    const dailyData = await query

    const xAxisData: string[] = []
    const totalCallsData: number[] = []
    const successCallsData: number[] = []
    const errorCallsData: number[] = []

    if (groupBy === 'day') {
      for (const item of dailyData) {
        xAxisData.push(item.statDate.toFormat('yyyy-MM-dd'))
        totalCallsData.push(item.totalCalls)
        successCallsData.push(item.successCalls)
        errorCallsData.push(item.errorCalls)
      }
    } else if (groupBy === 'week') {
      const weekMap = new Map<string, { total: number; success: number; error: number }>()

      for (const item of dailyData) {
        const weekKey = item.statDate.startOf('week').toFormat('yyyy-MM-dd')
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, { total: 0, success: 0, error: 0 })
        }
        const weekData = weekMap.get(weekKey)!
        weekData.total += item.totalCalls
        weekData.success += item.successCalls
        weekData.error += item.errorCalls
      }

      const sortedKeys = Array.from(weekMap.keys()).sort()
      for (const key of sortedKeys) {
        xAxisData.push(key)
        const data = weekMap.get(key)!
        totalCallsData.push(data.total)
        successCallsData.push(data.success)
        errorCallsData.push(data.error)
      }
    } else if (groupBy === 'month') {
      const monthMap = new Map<string, { total: number; success: number; error: number }>()

      for (const item of dailyData) {
        const monthKey = item.statDate.toFormat('yyyy-MM')
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { total: 0, success: 0, error: 0 })
        }
        const monthData = monthMap.get(monthKey)!
        monthData.total += item.totalCalls
        monthData.success += item.successCalls
        monthData.error += item.errorCalls
      }

      const sortedKeys = Array.from(monthMap.keys()).sort()
      for (const key of sortedKeys) {
        xAxisData.push(key)
        const data = monthMap.get(key)!
        totalCallsData.push(data.total)
        successCallsData.push(data.success)
        errorCallsData.push(data.error)
      }
    }

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'view_usage_trends',
      resourceType: 'usage',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { seatId, startDate, endDate, groupBy },
    })

    return {
      dates: xAxisData,
      values: totalCallsData,
      xAxis: xAxisData,
      series: [
        { name: '总调用量', data: totalCallsData, type: 'line' },
        { name: '成功调用', data: successCallsData, type: 'line' },
        { name: '失败调用', data: errorCallsData, type: 'line' },
      ],
    }
  }

  async records({ request, auth }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const { seatId, startDate, endDate, method, statusCode } = request.qs()

    const query = UsageRecord.query().preload('seat')

    if (seatId) {
      query.where('seatId', seatId)
    }

    if (startDate) {
      query.where('requestDate', '>=', DateTime.fromISO(startDate).toFormat('yyyy-MM-dd'))
    }

    if (endDate) {
      query.where('requestDate', '<=', DateTime.fromISO(endDate).toFormat('yyyy-MM-dd'))
    }

    if (method) {
      query.where('method', method)
    }

    if (statusCode) {
      query.where('statusCode', statusCode)
    }

    query.orderBy('requestDate', 'desc').orderBy('id', 'desc')

    const records = await query.paginate(page, perPage)

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'view_usage_records',
      resourceType: 'usage_record',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { seatId, startDate, endDate, page, perPage },
    })

    return {
      data: records.toJSON().data,
      meta: {
        total: records.total,
        page: records.currentPage,
        perPage: records.perPage,
        lastPage: records.lastPage,
      },
    }
  }

  async errors({ request, auth }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 20)
    const { seatId, startDate, endDate, errorType } = request.qs()

    const query = UsageRecord.query().where('isError', true).preload('seat')

    if (seatId) {
      query.where('seatId', seatId)
    }

    if (startDate) {
      query.where('requestDate', '>=', DateTime.fromISO(startDate).toFormat('yyyy-MM-dd'))
    }

    if (endDate) {
      query.where('requestDate', '<=', DateTime.fromISO(endDate).toFormat('yyyy-MM-dd'))
    }

    if (errorType) {
      query.where('errorMessage', 'like', `%${errorType}%`)
    }

    query.orderBy('requestDate', 'desc').orderBy('id', 'desc')

    const errors = await query.paginate(page, perPage)

    const errorTypeCounts = await UsageRecord.query()
      .where('isError', true)
      .if(seatId, (q) => q.where('seatId', seatId))
      .if(startDate, (q) => q.where('requestDate', '>=', DateTime.fromISO(startDate).toFormat('yyyy-MM-dd')))
      .if(endDate, (q) => q.where('requestDate', '<=', DateTime.fromISO(endDate).toFormat('yyyy-MM-dd')))
      .select('statusCode', db.raw('COUNT(*) as error_count'))
      .groupBy('statusCode')
      .orderBy('error_count', 'desc')
      .limit(10)

    const topSeatErrors = await UsageRecord.query()
      .where('isError', true)
      .if(startDate, (q) => q.where('requestDate', '>=', DateTime.fromISO(startDate).toFormat('yyyy-MM-dd')))
      .if(endDate, (q) => q.where('requestDate', '<=', DateTime.fromISO(endDate).toFormat('yyyy-MM-dd')))
      .select('seatId', db.raw('COUNT(*) as error_count'))
      .groupBy('seatId')
      .orderBy('error_count', 'desc')
      .limit(10)
      .preload('seat')

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'view_error_records',
      resourceType: 'usage_record',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { seatId, startDate, endDate, errorType, page, perPage },
    })

    return {
      data: errors.toJSON().data,
      meta: {
        total: errors.total,
        page: errors.currentPage,
        perPage: errors.perPage,
        lastPage: errors.lastPage,
      },
      stats: {
        errorTypeBreakdown: errorTypeCounts.map((e) => ({
          statusCode: e.statusCode,
          count: Number(e.$extras.error_count || 0),
        })),
        topErrorSeats: topSeatErrors.map((s) => ({
          seatId: s.seatId,
          seatCode: s.seat?.seatCode || '',
          customerName: s.seat?.customerName || '',
          count: Number(s.$extras.error_count || 0),
        })),
      },
    }
  }

  async summary({ request, auth }: HttpContext) {
    const { seatId, startDate, endDate } = request.qs()

    const start = startDate ? DateTime.fromISO(startDate) : DateTime.now().startOf('month')
    const end = endDate ? DateTime.fromISO(endDate) : DateTime.now()

    let summaryData

    if (seatId) {
      const seat = await Seat.query().where('id', seatId).preload('plan').firstOrFail()
      const stats = await DailyUsage.query()
        .where('seatId', seatId)
        .whereBetween('statDate', [start.toFormat('yyyy-MM-dd'), end.toFormat('yyyy-MM-dd')])
        .select(
          db.raw('COALESCE(SUM(total_calls), 0) as total_calls'),
          db.raw('COALESCE(SUM(success_calls), 0) as success_calls'),
          db.raw('COALESCE(SUM(error_calls), 0) as error_calls'),
          db.raw('COALESCE(AVG(avg_response_time), 0) as avg_response_time')
        )
        .first()

      summaryData = {
        seat: {
          id: seat.id,
          seatCode: seat.seatCode,
          customerName: seat.customerName,
          planName: seat.plan?.name,
        },
        totalCalls: Number(stats?.$extras.total_calls || 0),
        successCalls: Number(stats?.$extras.success_calls || 0),
        errorCalls: Number(stats?.$extras.error_calls || 0),
        avgResponseTime: Number(stats?.$extras.avg_response_time || 0),
        errorRate:
          Number(stats?.$extras.total_calls || 0) > 0
            ? (Number(stats?.$extras.error_calls || 0) / Number(stats?.$extras.total_calls || 0)) * 100
            : 0,
        startDate: start.toFormat('yyyy-MM-dd'),
        endDate: end.toFormat('yyyy-MM-dd'),
      }
    } else {
      const stats = await DailyUsage.query()
        .whereBetween('statDate', [start.toFormat('yyyy-MM-dd'), end.toFormat('yyyy-MM-dd')])
        .select(
          db.raw('COALESCE(SUM(total_calls), 0) as total_calls'),
          db.raw('COALESCE(SUM(success_calls), 0) as success_calls'),
          db.raw('COALESCE(SUM(error_calls), 0) as error_calls'),
          db.raw('COALESCE(AVG(avg_response_time), 0) as avg_response_time'),
          db.raw('COUNT(DISTINCT seat_id) as active_seats')
        )
        .first()

      const totalSeats = await Seat.query().count('* as total').first()

      summaryData = {
        totalCalls: Number(stats?.$extras.total_calls || 0),
        successCalls: Number(stats?.$extras.success_calls || 0),
        errorCalls: Number(stats?.$extras.error_calls || 0),
        avgResponseTime: Number(stats?.$extras.avg_response_time || 0),
        errorRate:
          Number(stats?.$extras.total_calls || 0) > 0
            ? (Number(stats?.$extras.error_calls || 0) / Number(stats?.$extras.total_calls || 0)) * 100
            : 0,
        activeSeats: Number(stats?.$extras.active_seats || 0),
        totalSeats: Number(totalSeats?.$extras.total || 0),
        startDate: start.toFormat('yyyy-MM-dd'),
        endDate: end.toFormat('yyyy-MM-dd'),
      }
    }

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'view_usage_summary',
      resourceType: 'usage',
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { seatId, startDate, endDate },
    })

    return summaryData
  }

  async seatUsage({ request, auth }: HttpContext) {
    const seatId = request.param('seatId')
    const { startDate, endDate } = request.qs()

    const seat = await Seat.query().where('id', seatId).preload('plan').firstOrFail()

    const start = startDate ? DateTime.fromISO(startDate) : DateTime.now().startOf('month')
    const end = endDate ? DateTime.fromISO(endDate) : DateTime.now()

    const stats = await DailyUsage.query()
      .where('seatId', seatId)
      .whereBetween('statDate', [start.toFormat('yyyy-MM-dd'), end.toFormat('yyyy-MM-dd')])
      .select(
        db.raw('COALESCE(SUM(total_calls), 0) as total_calls'),
        db.raw('COALESCE(SUM(success_calls), 0) as success_calls'),
        db.raw('COALESCE(SUM(error_calls), 0) as error_calls'),
        db.raw('COALESCE(AVG(avg_response_time), 0) as avg_response_time')
      )
      .first()

    const dailyRecords = await DailyUsage.query()
      .where('seatId', seatId)
      .whereBetween('statDate', [start.toFormat('yyyy-MM-dd'), end.toFormat('yyyy-MM-dd')])
      .orderBy('statDate', 'asc')

    const recentErrors = await UsageRecord.query()
      .where('seatId', seatId)
      .where('isError', true)
      .orderBy('requestDate', 'desc')
      .limit(10)

    const result = {
      seat: {
        id: seat.id,
        seatCode: seat.seatCode,
        customerId: seat.customerId,
        customerName: seat.customerName,
        planName: seat.plan?.name,
        status: seat.status,
        apiCallsUsed: seat.apiCallsUsed,
        apiCallsLimit: seat.apiCallsLimit,
        startDate: seat.startDate,
        endDate: seat.endDate,
      },
      summary: {
        totalCalls: Number(stats?.$extras.total_calls || 0),
        successCalls: Number(stats?.$extras.success_calls || 0),
        errorCalls: Number(stats?.$extras.error_calls || 0),
        avgResponseTime: Number(stats?.$extras.avg_response_time || 0),
        errorRate:
          Number(stats?.$extras.total_calls || 0) > 0
            ? (Number(stats?.$extras.error_calls || 0) / Number(stats?.$extras.total_calls || 0)) * 100
            : 0,
      },
      dailyRecords: dailyRecords.map((d) => ({
        statDate: d.statDate,
        totalCalls: d.totalCalls,
        successCalls: d.successCalls,
        errorCalls: d.errorCalls,
        avgResponseTime: d.avgResponseTime,
      })),
      recentErrors: recentErrors.map((e) => ({
        id: e.id,
        apiEndpoint: e.apiEndpoint,
        method: e.method,
        statusCode: e.statusCode,
        errorMessage: e.errorMessage,
        requestDate: e.requestDate,
      })),
      period: {
        startDate: start.toFormat('yyyy-MM-dd'),
        endDate: end.toFormat('yyyy-MM-dd'),
      },
    }

    const user = auth.getUserOrFail()
    await OperationLog.create({
      userId: user.id,
      userName: user.fullName,
      action: 'view_seat_usage',
      resourceType: 'seat',
      resourceId: seat.id,
      ipAddress: request.ip(),
      userAgent: request.header('user-agent'),
      details: { seatId, startDate, endDate },
    })

    return result
  }
}
