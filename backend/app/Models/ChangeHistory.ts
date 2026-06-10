import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Booking from './Booking'
import User from './User'

export default class ChangeHistory extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public bookingId: number

  @column()
  public fieldName: string

  @column()
  public oldValue: string

  @column()
  public newValue: string

  @column()
  public changedBy: number | null

  @column()
  public changeReason: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Booking)
  public booking: BelongsTo<typeof Booking>

  @belongsTo(() => User, { foreignKey: 'changedBy' })
  public changer: BelongsTo<typeof User>
}
