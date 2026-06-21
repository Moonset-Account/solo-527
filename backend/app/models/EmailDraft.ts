import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import PromptVersion from '#models/prompt_version'
import SpeechTemplateVersion from '#models/speech_template_version'
import CitedSource from '#models/cited_source'
import ReviewRecord from '#models/review_record'
import RejectReason from '#models/reject_reason'

export default class EmailDraft extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare subject: string

  @column()
  declare body: string

  @column()
  declare recipientEmail: string | null

  @column()
  declare recipientName: string | null

  @column()
  declare customerBackground: Record<string, any>

  @column()
  declare citedSources: unknown[]

  @column()
  declare status: 'draft' | 'reviewing' | 'approved' | 'rejected' | 'sent' | 'archived'

  @column()
  declare riskLevel: 'low' | 'medium' | 'high' | 'critical' | null

  @column()
  declare riskNotes: string | null

  @column()
  declare salesId: number | null

  @column()
  declare opsId: number | null

  @column()
  declare promptVersionId: number | null

  @column()
  declare speechTemplateVersionId: number | null

  @column()
  declare generationCost: number

  @column()
  declare reviewCount: number

  @column()
  declare rejectReasonId: number | null

  @column()
  declare rejectDetail: string | null

  @column.dateTime()
  declare submittedAt: DateTime | null

  @column.dateTime()
  declare approvedAt: DateTime | null

  @column.dateTime()
  declare rejectedAt: DateTime | null

  @column.dateTime()
  declare sentAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'salesId' })
  declare sales: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'opsId' })
  declare ops: BelongsTo<typeof User>

  @belongsTo(() => PromptVersion, { foreignKey: 'promptVersionId' })
  declare promptVersion: BelongsTo<typeof PromptVersion>

  @belongsTo(() => SpeechTemplateVersion, { foreignKey: 'speechTemplateVersionId' })
  declare speechTemplateVersion: BelongsTo<typeof SpeechTemplateVersion>

  @belongsTo(() => RejectReason, { foreignKey: 'rejectReasonId' })
  declare rejectReason: BelongsTo<typeof RejectReason>

  @hasMany(() => CitedSource, { foreignKey: 'emailDraftId' })
  declare citedSourceRelations: HasMany<typeof CitedSource>

  @hasMany(() => ReviewRecord, { foreignKey: 'emailDraftId' })
  declare reviewRecords: HasMany<typeof ReviewRecord>

  static notDeleted = scope((query) => {
    query.whereNull('deletedAt')
  })

  static forSales = scope((query, salesId: number) => {
    query.where('salesId', salesId)
  })

  static forOps = scope((query) => {
    query.whereIn('status', ['reviewing', 'approved', 'rejected'])
  })
}
