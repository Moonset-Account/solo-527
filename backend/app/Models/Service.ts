import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import TimeSlot from './TimeSlot'
import Booking from './Booking'

export default class Service extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public code: string

  @column()
  public description: string

  @column()
  public durationMinutes: number

  @column()
  public price: number

  @column()
  public capacity: number

  @column()
  public isActive: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => TimeSlot)
  public timeSlots: HasMany<typeof TimeSlot>

  @hasMany(() => Booking)
  public bookings: HasMany<typeof Booking>
}
