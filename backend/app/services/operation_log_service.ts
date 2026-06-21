import OperationLog from '#models/operation_log'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { paginate, buildPaginationMeta } from '../utils/helpers.js'
import User from '#models/user'

interface LogIndexParams {
  page?: number
  perPage?: number
  userId?: number
  action?: string
  resourceType?: string
  startDate?: string
  endDate?: string
}

interface PaginatedResult<T> {
  data: T[]
  pagination: any
}

export default class OperationLogService {
  private static instance: OperationLogService

  static getInstance(): OperationLogService {
    if (!OperationLogService.instance) {
      OperationLogService.instance = new OperationLogService()
    }
    return OperationLogService.instance
  }

  static async log(
    userId: number | null,
    action: string,
    resourceType: string | null,
    resourceId?: number,
    oldValue?: Record<string, any>,
    newValue?: Record<string, any>,
    request?: {
      ip?: string
      url?: string
      method?: string
      userAgent?: string
    },
  ): Promise<OperationLog | null> {
    try {
      const log = new OperationLog()
      log.userId = userId
      log.action = action
      log.resourceType = resourceType
      log.resourceId = resourceId || null
      log.oldValues = oldValue || {}
      log.newValues = newValue || {}
      log.ipAddress = request?.ip || null
      log.userAgent = request?.userAgent || null
      await log.save()
      return log
    } catch (error) {
      console.error('Failed to write operation log:', error)
      return null
    }
  }

  async writeLog(
    userId: number | null,
    action: string,
    resourceType: string | null,
    resourceId?: number,
    oldValue?: Record<string, any>,
    newValue?: Record<string, any>,
    request?: {
      ip?: string
      url?: string
      method?: string
      userAgent?: string
    },
  ): Promise<OperationLog | null> {
    return OperationLogService.log(userId, action, resourceType, resourceId, oldValue, newValue, request)
  }

  async index(params: LogIndexParams): Promise<PaginatedResult<OperationLog>> {
    const { page, perPage, limit, offset } = paginate(params.page, params.perPage)

    const query = OperationLog.query()
      .preload('user', (q) => q.select('id', 'username', 'fullName', 'role'))
      .orderBy('createdAt', 'desc')

    if (params.userId) {
      query.where('userId', params.userId)
    }

    if (params.action) {
      query.whereILike('action', `%${params.action}%`)
    }

    if (params.resourceType) {
      query.where('resourceType', params.resourceType)
    }

    if (params.startDate) {
      query.where(
        'createdAt',
        '>=',
        DateTime.fromFormat(params.startDate, 'yyyy-MM-dd').startOf('day').toISO(),
      )
    }
    if (params.endDate) {
      query.where(
        'createdAt',
        '<=',
        DateTime.fromFormat(params.endDate, 'yyyy-MM-dd').endOf('day').toISO(),
      )
    }

    const cloneQuery = query.clone()
    const total = await cloneQuery.count('* as total')
    const totalCount = Number(total[0].$extras.total || 0)

    const data = await query.limit(limit).offset(offset).exec()

    return {
      data,
      pagination: buildPaginationMeta(totalCount, page, perPage),
    }
  }

  async getStats(days = 7): Promise<{
    total: number
    byAction: Record<string, number>
    byResource: Record<string, number>
    byUser: Array<{ userId: number; username: string; count: number }>
    daily: Array<{ date: string; count: number }>
  }> {
    const { start, end } = {
      start: DateTime.now().minus({ days: days - 1 }).startOf('day'),
      end: DateTime.now().endOf('day'),
    }

    const totalResult = await OperationLog.query()
      .where('createdAt', '>=', start.toISO())
      .where('createdAt', '<=', end.toISO())
      .count('* as total')

    const total = Number(totalResult[0].$extras.total || 0)

    const actionResults: any[] = await OperationLog.query()
      .where('createdAt', '>=', start.toISO())
      .where('createdAt', '<=', end.toISO())
      .select('action')
      .select(db.raw('COUNT(*) as action_count'))
      .groupBy('action')
      .orderByRaw('COUNT(*) DESC')
      .limit(10)
      .exec()

    const byAction: Record<string, number> = {}
    actionResults.forEach((r: any) => {
      byAction[r.action] = Number(r.$extras.action_count || 0)
    })

    const resourceResults: any[] = await OperationLog.query()
      .where('createdAt', '>=', start.toISO())
      .where('createdAt', '<=', end.toISO())
      .whereNotNull('resourceType')
      .select('resourceType')
      .select(db.raw('COUNT(*) as resource_count'))
      .groupBy('resourceType')
      .orderByRaw('COUNT(*) DESC')
      .limit(10)
      .exec()

    const byResource: Record<string, number> = {}
    resourceResults.forEach((r: any) => {
      byResource[r.resourceType!] = Number(r.$extras.resource_count || 0)
    })

    const userResults: any[] = await OperationLog.query()
      .where('operationLogs.createdAt', '>=', start.toISO())
      .where('operationLogs.createdAt', '<=', end.toISO())
      .whereNotNull('operationLogs.userId')
      .leftJoin('users', 'operationLogs.userId', 'users.id')
      .select('operationLogs.userId as user_id')
      .select(db.raw('COALESCE(users.username, ?) as username', ['Unknown']))
      .select(db.raw('COUNT(*) as user_count'))
      .groupBy('operationLogs.userId', 'users.username')
      .orderByRaw('COUNT(*) DESC')
      .limit(10)
      .exec()

    const byUser = userResults.map((r: any) => ({
      userId: Number(r.$extras.user_id),
      username: r.$extras.username,
      count: Number(r.$extras.user_count || 0),
    }))

    const dates: string[] = []
    let current = start
    while (current <= end) {
      dates.push(current.toFormat('yyyy-MM-dd'))
      current = current.plus({ days: 1 })
    }

    const dailyResults: any[] = await OperationLog.query()
      .where('createdAt', '>=', start.toISO())
      .where('createdAt', '<=', end.toISO())
      .select(db.raw('DATE(created_at) as date_key'))
      .select(db.raw('COUNT(*) as daily_count'))
      .groupByRaw('DATE(created_at)')
      .exec()

    const dailyMap: Record<string, number> = {}
    dailyResults.forEach((r: any) => {
      dailyMap[r.$extras.date_key] = Number(r.$extras.daily_count || 0)
    })

    const daily = dates.map((date) => ({
      date,
      count: dailyMap[date] || 0,
    }))

    return {
      total,
      byAction,
      byResource,
      byUser,
      daily,
    }
  }
}
