import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Order from './Order'
import SponsorshipBenefit from './SponsorshipBenefit'
import User from './User'

export default class OrderComment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public orderId: number

  @column()
  public benefitId: number | null

  @column()
  public userId: number

  @column()
  public content: string

  @column()
  public revisionRound: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  public order: BelongsTo<typeof Order>

  @belongsTo(() => SponsorshipBenefit, { foreignKey: 'benefitId' })
  public benefit: BelongsTo<typeof SponsorshipBenefit>

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user: BelongsTo<typeof User>
}
