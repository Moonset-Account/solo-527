import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import BrandPartnership from './BrandPartnership'
import OrderComment from './OrderComment'
import OrderAttachment from './OrderAttachment'

export default class SponsorshipBenefit extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public partnershipId: number

  @column()
  public benefitType: string

  @column()
  public name: string

  @column()
  public description: string | null

  @column()
  public quantity: number

  @column()
  public unitPrice: number | null

  @column()
  public totalAmount: number | null

  @column()
  public status: string

  @column()
  public deliveryStatus: string

  @column.date()
  public expectedDeliveryDate: DateTime | null

  @column.date()
  public actualDeliveryDate: DateTime | null

  @column()
  public revisionRound: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => BrandPartnership, { foreignKey: 'partnershipId' })
  public partnership: BelongsTo<typeof BrandPartnership>

  @hasMany(() => OrderComment, { foreignKey: 'benefitId' })
  public comments: HasMany<typeof OrderComment>

  @hasMany(() => OrderAttachment, { foreignKey: 'benefitId' })
  public attachments: HasMany<typeof OrderAttachment>
}
