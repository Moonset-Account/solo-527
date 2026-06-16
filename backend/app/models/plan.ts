import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, beforeSave, afterFind, afterFetch } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Seat from './seat.js'

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

export default class Plan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare code: string

  @column()
  declare description: string | null

  @column({ columnName: 'price_monthly' })
  declare priceMonthly: number

  @column({ columnName: 'price_yearly' })
  declare priceYearly: number

  @column({ columnName: 'api_calls_limit' })
  declare apiCallsLimit: number

  @column({ columnName: 'seat_limit' })
  declare seatLimit: number

  @column()
  declare features: Record<string, any> | null

  @column()
  declare status: string

  @column({ columnName: 'sort_order' })
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Seat)
  declare seats: HasMany<typeof Seat>

  @beforeSave()
  static async stringifyFeatures(plan: Plan) {
    plan.$attributes.features = stringifyJson(plan.features) as any
  }

  @afterFind()
  static async parseFeaturesOne(plan: Plan) {
    plan.features = parseJson(plan.$attributes.features)
  }

  @afterFetch()
  static async parseFeaturesMany(plans: Plan[]) {
    plans.forEach((p) => (p.features = parseJson(p.$attributes.features)))
  }
}
