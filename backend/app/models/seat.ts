import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Plan from './plan.js'
import SeatNote from './seat_note.js'
import UsageRecord from './usage_record.js'
import DailyUsage from './daily_usage.js'
import Bill from './bill.js'
import RenewalList from './renewal_list.js'

export default class Seat extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'customer_id' })
  declare customerId: string

  @column({ columnName: 'customer_name' })
  declare customerName: string

  @column({ columnName: 'plan_id' })
  declare planId: number

  @column({ columnName: 'seat_code' })
  declare seatCode: string

  @column()
  declare status: string

  @column({ columnName: 'billing_cycle' })
  declare billingCycle: string

  @column({ columnName: 'api_key' })
  declare apiKey: string | null

  @column({ columnName: 'api_calls_used' })
  declare apiCallsUsed: number

  @column({ columnName: 'api_calls_limit' })
  declare apiCallsLimit: number

  @column.dateTime({ columnName: 'start_date' })
  declare startDate: DateTime

  @column.dateTime({ columnName: 'end_date' })
  declare endDate: DateTime | null

  @column.dateTime({ columnName: 'trial_end_date' })
  declare trialEndDate: DateTime | null

  @column({ columnName: 'is_idle' })
  declare isIdle: boolean

  @column({ columnName: 'idle_days' })
  declare idleDays: number

  @column.dateTime({ columnName: 'last_activity_at' })
  declare lastActivityAt: DateTime | null

  @column()
  declare notes: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan> | null

  @hasMany(() => SeatNote)
  declare seatNotes: HasMany<typeof SeatNote>

  @hasMany(() => UsageRecord)
  declare usageRecords: HasMany<typeof UsageRecord>

  @hasMany(() => DailyUsage)
  declare dailyUsages: HasMany<typeof DailyUsage>

  @hasMany(() => Bill)
  declare bills: HasMany<typeof Bill>

  @hasOne(() => RenewalList)
  declare renewalList: HasOne<typeof RenewalList> | null
}
