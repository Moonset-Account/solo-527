import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class PermissionRequest extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare requestedRole: string

  @column()
  declare reason: string | null

  @column()
  declare status: 'pending' | 'approved' | 'rejected'

  @column()
  declare reviewerId: string | null

  @column()
  declare reviewComment: string | null

  @column.dateTime()
  declare reviewedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'reviewerId' })
  declare reviewer: BelongsTo<typeof User>
}
