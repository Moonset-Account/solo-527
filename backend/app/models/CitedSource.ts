import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import EmailDraft from '#models/email_draft'
import KnowledgeItem from '#models/knowledge_item'
import User from '#models/user'

export default class CitedSource extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare emailDraftId: number

  @column()
  declare knowledgeItemId: number | null

  @column()
  declare sourceTitle: string

  @column()
  declare sourceContent: string

  @column()
  declare relevanceScore: number | null

  @column()
  declare createdBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => EmailDraft, { foreignKey: 'emailDraftId' })
  declare emailDraft: BelongsTo<typeof EmailDraft>

  @belongsTo(() => KnowledgeItem, { foreignKey: 'knowledgeItemId' })
  declare knowledgeItem: BelongsTo<typeof KnowledgeItem>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>
}
