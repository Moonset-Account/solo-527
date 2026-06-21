import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import EmailDraft from '#models/email_draft'

export default class CostRecord extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare emailDraftId: number | null

  @column()
  declare costType: 'generation' | 'review' | 'embedding' | 'other'

  @column()
  declare promptTokens: number

  @column()
  declare completionTokens: number

  @column()
  declare totalTokens: number

  @column()
  declare costUsd: number

  @column()
  declare costCents: number

  @column()
  declare modelName: string | null

  @column()
  declare metadata: Record<string, any>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => EmailDraft, { foreignKey: 'emailDraftId' })
  declare emailDraft: BelongsTo<typeof EmailDraft>
}
