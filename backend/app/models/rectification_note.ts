import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Rectification from './rectification.js'
import User from './user.js'

export default class RectificationNote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare rectificationId: number

  @column()
  declare content: string

  @column()
  declare createdBy: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Rectification)
  declare rectification: BelongsTo<typeof Rectification>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>
}
