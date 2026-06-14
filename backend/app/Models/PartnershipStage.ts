import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import BrandPartnership from './BrandPartnership'
import User from './User'

export default class PartnershipStage extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public partnershipId: number

  @column()
  public stage: string

  @column()
  public status: string

  @column()
  public notes: string | null

  @column()
  public createdBy: number | null

  @column.dateTime()
  public completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => BrandPartnership, { foreignKey: 'partnershipId' })
  public partnership: BelongsTo<typeof BrandPartnership>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  public creator: BelongsTo<typeof User>
}
