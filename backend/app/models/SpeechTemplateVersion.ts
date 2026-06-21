import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import SpeechTemplate from '#models/speech_template'
import User from '#models/user'
import EmailDraft from '#models/email_draft'

export default class SpeechTemplateVersion extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare speechTemplateId: number

  @column()
  declare version: string

  @column()
  declare content: string

  @column()
  declare variables: string | null

  @column()
  declare isCurrent: boolean

  @column()
  declare createdBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => SpeechTemplate, { foreignKey: 'speechTemplateId' })
  declare speechTemplate: BelongsTo<typeof SpeechTemplate>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => EmailDraft, { foreignKey: 'speechTemplateVersionId' })
  declare emailDrafts: HasMany<typeof EmailDraft>
}
