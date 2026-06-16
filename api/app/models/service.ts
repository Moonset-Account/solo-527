import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import ServiceConsumable from './service_consumable.js'
import AppointmentItem from './appointment_item.js'

export default class Service extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare category: string

  @column.decimal()
  declare price: number

  @column()
  declare durationMinutes: number

  @column()
  declare description: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => ServiceConsumable)
  declare consumables: HasMany<typeof ServiceConsumable>

  @hasMany(() => AppointmentItem)
  declare appointmentItems: HasMany<typeof AppointmentItem>
}
