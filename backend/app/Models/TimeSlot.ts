import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Staff from './Staff'
import Service from './Service'
import Booking from './Booking'

export default class TimeSlot extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public slotDate: DateTime

  @column()
  public startTime: string

  @column()
  public endTime: string

  @column()
  public staffId: number

  @column()
  public serviceId: number

  @column()
  public capacity: number

  @column()
  public bookedCount: number

  @column()
  public status: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Staff)
  public staff: BelongsTo<typeof Staff>

  @belongsTo(() => Service)
  public service: BelongsTo<typeof Service>

  @hasMany(() => Booking)
  public bookings: HasMany<typeof Booking>
}
