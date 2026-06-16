import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Seat from './seat.js'

export default class Bill extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'bill_no' })
  declare billNo: string

  @column({ columnName: 'seat_id' })
  declare seatId: number

  @column({ columnName: 'customer_id' })
  declare customerId: string

  @column({ columnName: 'customer_name' })
  declare customerName: string

  @column({ columnName: 'plan_name' })
  declare planName: string

  @column({ columnName: 'billing_month' })
  declare billingMonth: string

  @column.date({ columnName: 'period_start' })
  declare periodStart: DateTime

  @column.date({ columnName: 'period_end' })
  declare periodEnd: DateTime

  @column()
  declare amount: number

  @column({ columnName: 'api_calls_used' })
  declare apiCallsUsed: number

  @column()
  declare status: string

  @column.date({ columnName: 'due_date' })
  declare dueDate: DateTime | null

  @column.dateTime({ columnName: 'paid_at' })
  declare paidAt: DateTime | null

  @column()
  declare remark: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Seat)
  declare seat: BelongsTo<typeof Seat> | null
}
