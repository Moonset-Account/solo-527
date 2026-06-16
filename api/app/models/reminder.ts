import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ReminderRule from './reminder_rule.js'
import User from './user.js'

export default class Reminder extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ruleId: number

  @column()
  declare entityType: string

  @column()
  declare entityId: number

  @column()
  declare level: string

  @column()
  declare title: string

  @column()
  declare message: string

  @column()
  declare isRead: boolean

  @column()
  declare isResolved: boolean

  @column()
  declare assignedTo: number | null

  @column.dateTime()
  declare escalatedAt: DateTime | null

  @column.dateTime()
  declare resolvedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ReminderRule)
  declare rule: BelongsTo<typeof ReminderRule>

  @belongsTo(() => User, { foreignKey: 'assignedTo' })
  declare assignee: BelongsTo<typeof User>
}
