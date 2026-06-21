import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import EmailDraft from '#models/email_draft'
import User from '#models/user'
import RejectReason from '#models/reject_reason'

export default class ReviewRecord extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare emailDraftId: number

  @column()
  declare reviewerId: number | null

  @column()
  declare action: 'approved' | 'rejected' | 'requested_changes'

  @column()
  declare comments: string | null

  @column()
  declare editsMade: Record<string, any>

  @column()
  declare rejectReasonId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => EmailDraft, { foreignKey: 'emailDraftId' })
  declare emailDraft: BelongsTo<typeof EmailDraft>

  @belongsTo(() => User, { foreignKey: 'reviewerId' })
  declare reviewer: BelongsTo<typeof User>

  @belongsTo(() => RejectReason, { foreignKey: 'rejectReasonId' })
  declare rejectReason: BelongsTo<typeof RejectReason>
}
