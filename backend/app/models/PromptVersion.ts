import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import EmailDraft from '#models/email_draft'

export default class PromptVersion extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare promptType: string

  @column()
  declare version: string

  @column()
  declare systemPrompt: string

  @column()
  declare userPromptTemplate: string | null

  @column()
  declare parameters: Record<string, any>

  @column()
  declare isActive: boolean

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

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'updatedBy' })
  declare updater: BelongsTo<typeof User>

  @hasMany(() => EmailDraft, { foreignKey: 'promptVersionId' })
  declare emailDrafts: HasMany<typeof EmailDraft>

  static active = scope((query) => {
    query.where('is_active', true).whereNull('deletedAt')
  })
}
