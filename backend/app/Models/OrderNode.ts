import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Order from './Order'
import User from './User'

export default class OrderNode extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public orderId: number

  @column()
  public nodeType: string

  @column()
  public name: string

  @column()
  public status: string

  @column()
  public description: string | null

  @column()
  public createdBy: number | null

  @column.dateTime()
  public scheduledAt: DateTime | null

  @column.dateTime()
  public completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  public order: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  public creator: BelongsTo<typeof User>
}
