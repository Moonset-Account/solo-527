import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Appointment from './appointment.js'
import Service from './service.js'
import Consumption from './consumption.js'

export default class AppointmentItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare appointmentId: number

  @column()
  declare serviceId: number

  @column.decimal()
  declare price: number

  @column()
  declare status: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Appointment)
  declare appointment: BelongsTo<typeof Appointment>

  @belongsTo(() => Service)
  declare service: BelongsTo<typeof Service>
}
