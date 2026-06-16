import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Seat from './seat.js'
import User from './user.js'

export default class RenewalList extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'seat_id' })
  declare seatId: number

  @column({ columnName: 'customer_id' })
  declare customerId: string

  @column({ columnName: 'customer_name' })
  declare customerName: string

  @column({ columnName: 'plan_name' })
  declare planName: string

  @column.date({ columnName: 'expiry_date' })
  declare expiryDate: DateTime

  @column()
  declare status: string

  @column()
  declare priority: string

  @column({ columnName: 'assigned_to' })
  declare assignedTo: number | null

  @column.dateTime({ columnName: 'last_follow_up_at' })
  declare lastFollowUpAt: DateTime | null

  @column.dateTime({ columnName: 'next_follow_up_at' })
  declare nextFollowUpAt: DateTime | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Seat)
  declare seat: BelongsTo<typeof Seat> | null

  @belongsTo(() => User, {
    foreignKey: 'assignedTo',
  })
  declare assignedUser: BelongsTo<typeof User> | null
}
