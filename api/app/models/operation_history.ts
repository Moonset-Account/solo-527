import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class OperationHistory extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare operatorId: string

  @column()
  declare action: string

  @column()
  declare targetType: string

  @column()
  declare targetName: string | null

  @column()
  declare detail: string | null

  @column()
  declare handoverNote: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'operatorId' })
  declare operator: BelongsTo<typeof User>
}
