import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import TimeSlot from './TimeSlot'
import StaffSchedule from './StaffSchedule'
import Booking from './Booking'

export default class Staff extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public title: string

  @column()
  public type: string

  @column()
  public phone: string

  @column()
  public specialties: string

  @column()
  public isActive: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => TimeSlot)
  public timeSlots: HasMany<typeof TimeSlot>

  @hasMany(() => StaffSchedule)
  public schedules: HasMany<typeof StaffSchedule>

  @hasMany(() => Booking)
  public bookings: HasMany<typeof Booking>
}
