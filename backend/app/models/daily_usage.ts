import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Seat from './seat.js'

export default class DailyUsage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'seat_id' })
  declare seatId: number

  @column.date({ columnName: 'stat_date' })
  declare statDate: DateTime

  @column({ columnName: 'total_calls' })
  declare totalCalls: number

  @column({ columnName: 'success_calls' })
  declare successCalls: number

  @column({ columnName: 'error_calls' })
  declare errorCalls: number

  @column({ columnName: 'avg_response_time' })
  declare avgResponseTime: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Seat)
  declare seat: BelongsTo<typeof Seat> | null
}
