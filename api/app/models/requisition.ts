import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Project from '#models/project'
import RequisitionItem from '#models/requisition_item'

export default class Requisition extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare applicantId: string

  @column()
  declare projectId: string

  @column()
  declare status: 'pending' | 'approved' | 'rejected' | 'completed'

  @column()
  declare purpose: string

  @column()
  declare reviewerId: string | null

  @column()
  declare reviewComment: string | null

  @column.dateTime()
  declare reviewedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'applicantId' })
  declare applicant: BelongsTo<typeof User>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @belongsTo(() => User, { foreignKey: 'reviewerId' })
  declare reviewer: BelongsTo<typeof User>

  @hasMany(() => RequisitionItem)
  declare items: HasMany<typeof RequisitionItem>
}
