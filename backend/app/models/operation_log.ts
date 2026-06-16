import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, beforeSave, afterFind, afterFetch } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

function parseJson(val: any): Record<string, any> | null {
  if (!val) return null
  if (typeof val === 'object') return val
  try {
    return JSON.parse(val)
  } catch {
    return val
  }
}

function stringifyJson(val: any): string | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'string') return val
  try {
    return JSON.stringify(val)
  } catch {
    return null
  }
}

export default class OperationLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column({ columnName: 'user_name' })
  declare userName: string | null

  @column()
  declare action: string

  @column({ columnName: 'resource_type' })
  declare resourceType: string

  @column({ columnName: 'resource_id' })
  declare resourceId: number | null

  @column({ columnName: 'ip_address' })
  declare ipAddress: string | null

  @column({ columnName: 'user_agent' })
  declare userAgent: string | null

  @column()
  declare details: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User> | null

  @beforeSave()
  static async stringifyDetails(log: OperationLog) {
    log.$attributes.details = stringifyJson(log.details) as any
  }

  @afterFind()
  static async parseDetailsOne(log: OperationLog) {
    log.details = parseJson(log.$attributes.details)
  }

  @afterFetch()
  static async parseDetailsMany(logs: OperationLog[]) {
    logs.forEach((l) => (l.details = parseJson(l.$attributes.details)))
  }

  static async safeCreate(params: {
    userId?: number | null
    userName?: string | null
    user?: { id?: number; fullName?: string | null; email?: string }
    action: string
    resourceType: string
    resourceId?: number | null
    ipAddress?: string | null
    userAgent?: string | null
    details?: Record<string, any> | null
  }) {
    const userName = params.userName ?? params.user?.fullName ?? params.user?.email ?? null
    const userId = params.userId ?? params.user?.id ?? null
    return await OperationLog.create({
      userId,
      userName,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      details: params.details ?? null,
    })
  }
}
