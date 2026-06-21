import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, scope } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import EmailDraft from '#models/email_draft'
import ReviewRecord from '#models/review_record'

export default class RejectReason extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare category: 'content' | 'compliance' | 'format' | 'data' | 'other'

  @column()
  declare sortOrder: number

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => EmailDraft, { foreignKey: 'rejectReasonId' })
  declare emailDrafts: HasMany<typeof EmailDraft>

  @hasMany(() => ReviewRecord, { foreignKey: 'rejectReasonId' })
  declare reviewRecords: HasMany<typeof ReviewRecord>

  static active = scope((query) => {
    query.where('is_active', true).orderBy('sortOrder', 'asc')
  })
}
