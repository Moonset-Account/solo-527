import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Technician from './technician.js'
import Order from './order.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class AttendanceRecord extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare technicianId: number

  @column()
  declare orderId: number

  @column.dateTime()
  declare scheduledTime: DateTime

  @column.dateTime()
  declare actualArrivalTime: DateTime | null

  @column()
  declare lateReason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Technician)
  declare technician: BelongsTo<typeof Technician>

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>
}
