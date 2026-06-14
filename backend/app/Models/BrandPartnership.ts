import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import PartnershipStage from './PartnershipStage'
import SponsorshipBenefit from './SponsorshipBenefit'
import Order from './Order'

export default class BrandPartnership extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public code: string

  @column()
  public brandName: string

  @column()
  public brandIndustry: string | null

  @column()
  public contactName: string | null

  @column()
  public contactPhone: string | null

  @column()
  public contactEmail: string | null

  @column()
  public contractAmount: number | null

  @column()
  public currentStage: string

  @column()
  public priority: string

  @column()
  public status: string

  @column()
  public responsibleUserId: number | null

  @column.date()
  public expectedSignDate: DateTime | null

  @column.date()
  public actualSignDate: DateTime | null

  @column()
  public description: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'responsibleUserId' })
  public responsibleUser: BelongsTo<typeof User>

  @hasMany(() => PartnershipStage, { foreignKey: 'partnershipId' })
  public stages: HasMany<typeof PartnershipStage>

  @hasMany(() => SponsorshipBenefit, { foreignKey: 'partnershipId' })
  public benefits: HasMany<typeof SponsorshipBenefit>

  @hasMany(() => Order, { foreignKey: 'partnershipId' })
  public orders: HasMany<typeof Order>
}
