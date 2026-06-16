import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Seat from './seat.js'

export default class UsageRecord extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'seat_id' })
  declare seatId: number

  @column({ columnName: 'api_endpoint' })
  declare apiEndpoint: string

  @column()
  declare method: string

  @column({ columnName: 'status_code' })
  declare statusCode: number

  @column({ columnName: 'response_time' })
  declare responseTime: number | null

  @column.date({ columnName: 'request_date' })
  declare requestDate: DateTime

  @column({ columnName: 'is_error' })
  declare isError: boolean

  @column({ columnName: 'error_message' })
  declare errorMessage: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Seat)
  declare seat: BelongsTo<typeof Seat> | null
}
