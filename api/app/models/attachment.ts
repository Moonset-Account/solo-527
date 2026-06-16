import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Attachment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare attachableType: string

  @column()
  declare attachableId: number

  @column()
  declare fileName: string

  @column()
  declare fileType: string

  @column.bigint()
  declare fileSize: bigint

  @column()
  declare disk: string

  @column()
  declare path: string

  @column()
  declare uploadedBy: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'uploadedBy' })
  declare uploader: BelongsTo<typeof User>
}
