import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, hasOne, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne, BelongsTo } from '@adonisjs/lucid/types/relations'
import SpeechTemplateVersion from '#models/speech_template_version'
import User from '#models/user'

export default class SpeechTemplate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare category: string | null

  @column()
  declare currentVersionId: number | null

  @column()
  declare createdBy: number | null

  @column()
  declare updatedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @hasMany(() => SpeechTemplateVersion, { foreignKey: 'speechTemplateId' })
  declare versions: HasMany<typeof SpeechTemplateVersion>

  @hasOne(() => SpeechTemplateVersion, { foreignKey: 'id', localKey: 'currentVersionId' })
  declare currentVersion: HasOne<typeof SpeechTemplateVersion>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'updatedBy' })
  declare updater: BelongsTo<typeof User>
}
