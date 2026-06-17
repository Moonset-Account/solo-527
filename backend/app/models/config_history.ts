import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ConfigHistory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare configKey: string

  @column()
  declare oldValue: string | null

  @column()
  declare newValue: string | null

  @column()
  declare changeReason: string | null

  @column()
  declare operatorId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'operatorId',
  })
  declare operator: BelongsTo<typeof User>
}
