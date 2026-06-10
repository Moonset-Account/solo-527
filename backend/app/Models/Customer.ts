import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Booking from './Booking'
import ExceptionTodo from './ExceptionTodo'

export default class Customer extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public phone: string

  @column()
  public gender: string

  @column()
  public age: number

  @column()
  public medicalHistory: string

  @column()
  public noShowCount: number

  @column()
  public totalBookings: number

  @column()
  public noShowRate: number

  @column.dateTime()
  public lastVisit: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Booking)
  public bookings: HasMany<typeof Booking>

  @hasMany(() => ExceptionTodo)
  public exceptionTodos: HasMany<typeof ExceptionTodo>
}
