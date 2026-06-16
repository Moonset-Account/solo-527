import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Seat from './seat.js'
import User from './user.js'

export default class SeatNote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'seat_id' })
  declare seatId: number

  @column({ columnName: 'operator_id' })
  declare operatorId: number

  @column()
  declare type: string

  @column()
  declare content: string

  @column()
  declare result: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Seat)
  declare seat: BelongsTo<typeof Seat> | null

  @belongsTo(() => User, {
    foreignKey: 'operatorId',
  })
  declare operator: BelongsTo<typeof User> | null
}
