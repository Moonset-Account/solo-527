import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Reminder from './reminder.js'

export default class ReminderRule extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare entityType: string

  @column()
  declare metric: string

  @column()
  declare operator: string

  @column.decimal()
  declare threshold: number

  @column()
  declare level: string

  @column()
  declare messageTemplate: string

  @column()
  declare timeoutMinutes: number

  @column()
  declare escalationLevel: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Reminder)
  declare reminders: HasMany<typeof Reminder>
}
