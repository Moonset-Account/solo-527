import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import SubscriptionPlan from './SubscriptionPlan'
import RefundException from './RefundException'

export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number

  @column()
  public planId: number | null

  @column()
  public status: string

  @column()
  public billingCycle: string

  @column()
  public amount: number

  @column.dateTime()
  public startDate: DateTime

  @column.dateTime()
  public endDate: DateTime | null

  @column.dateTime()
  public nextBillingDate: DateTime | null

  @column.dateTime()
  public cancelledAt: DateTime | null

  @column()
  public cancelReason: string | null

  @column()
  public autoRenew: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user: BelongsTo<typeof User>

  @belongsTo(() => SubscriptionPlan, { foreignKey: 'planId' })
  public plan: BelongsTo<typeof SubscriptionPlan>

  @hasMany(() => RefundException, { foreignKey: 'subscriptionId' })
  public refunds: HasMany<typeof RefundException>
}
