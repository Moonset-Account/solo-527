import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class ChangeLog extends BaseModel {
  static table = 'change_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare entityType: string

  @column()
  declare entityId: number

  @column()
  declare action: string

  @column()
  declare fieldName: string | null

  @column()
  declare oldValue: string | null

  @column()
  declare newValue: string | null

  @column()
  declare changedBy: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'changedBy' })
  declare changer: BelongsTo<typeof User>
}
