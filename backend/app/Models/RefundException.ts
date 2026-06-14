import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Order from './Order'
import Subscription from './Subscription'
import User from './User'

export default class RefundException extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public orderId: number

  @column()
  public subscriptionId: number | null

  @column()
  public exceptionType: string

  @column()
  public status: string

  @column()
  public refundAmount: number

  @column()
  public reason: string | null

  @column()
  public description: string | null

  @column()
  public reportedBy: number | null

  @column()
  public handlerId: number | null

  @column()
  public handlerConclusion: string | null

  @column.dateTime()
  public handledAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  public order: BelongsTo<typeof Order>

  @belongsTo(() => Subscription, { foreignKey: 'subscriptionId' })
  public subscription: BelongsTo<typeof Subscription>

  @belongsTo(() => User, { foreignKey: 'reportedBy' })
  public reporter: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'handlerId' })
  public handler: BelongsTo<typeof User>
}
