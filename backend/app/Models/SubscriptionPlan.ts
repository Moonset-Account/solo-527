import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Subscription from './Subscription'

export default class SubscriptionPlan extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public planCode: string

  @column()
  public name: string

  @column()
  public description: string | null

  @column()
  public features: string | null

  @column()
  public monthlyPrice: number

  @column()
  public yearlyPrice: number

  @column()
  public billingCycle: string

  @column()
  public level: string

  @column()
  public isActive: boolean

  @column()
  public sortOrder: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Subscription, { foreignKey: 'planId' })
  public subscriptions: HasMany<typeof Subscription>
}
