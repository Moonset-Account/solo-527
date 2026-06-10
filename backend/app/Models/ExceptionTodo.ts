import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Booking from './Booking'
import Customer from './Customer'
import User from './User'

export default class ExceptionTodo extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public type: string

  @column()
  public title: string

  @column()
  public description: string

  @column()
  public bookingId: number | null

  @column()
  public customerId: number | null

  @column()
  public priority: string

  @column()
  public status: string

  @column()
  public assignedTo: number | null

  @column()
  public handledBy: number | null

  @column()
  public resolution: string

  @column.dateTime()
  public handledAt: DateTime | null

  @column.dateTime()
  public deadlineAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Booking)
  public booking: BelongsTo<typeof Booking>

  @belongsTo(() => Customer)
  public customer: BelongsTo<typeof Customer>

  @belongsTo(() => User, { foreignKey: 'assignedTo' })
  public assignee: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'handledBy' })
  public handler: BelongsTo<typeof User>
}
