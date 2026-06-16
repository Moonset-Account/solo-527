import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import AppointmentItem from './appointment_item.js'

export default class Appointment extends BaseModel {
  static table = 'appointments'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare customerName: string

  @column()
  declare customerPhone: string

  @column()
  declare consultantId: number

  @column.date()
  declare appointmentDate: DateTime

  @column()
  declare startTime: string

  @column()
  declare endTime: string

  @column()
  declare status: string

  @column()
  declare notes: string | null

  @column.decimal()
  declare totalAmount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'consultantId' })
  declare consultant: BelongsTo<typeof User>

  @hasMany(() => AppointmentItem)
  declare items: HasMany<typeof AppointmentItem>
}
