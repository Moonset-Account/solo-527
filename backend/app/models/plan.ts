import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Seat from './seat.js'

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
}
