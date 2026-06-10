import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany, beforeCreate } from '@ioc:Adonis/Lucid/Orm'
import Customer from './Customer'
import TimeSlot from './TimeSlot'
import Staff from './Staff'
import Service from './Service'
import User from './User'
import BookingAttachment from './BookingAttachment'
import BookingNote from './BookingNote'
import ChangeHistory from './ChangeHistory'
import ExceptionTodo from './ExceptionTodo'

export default class Booking extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public bookingNo: string

  @column()
  public customerId: number

  @column()
  public timeSlotId: number

  @column()
  public staffId: number

  @column()
  public serviceId: number

  @column()
  public bookingDate: DateTime

  @column()
  public startTime: string

  @column()
  public endTime: string

  @column()
  public status: string

  @column()
  public amount: number

  @column()
  public paymentStatus: string

  @column()
  public isNoShow: boolean

  @column()
  public source: string

  @column()
  public remark: string

  @column()
  public createdBy: number | null

  @column.dateTime()
  public paidAt: DateTime | null

  @column.dateTime()
  public arrivedAt: DateTime | null

  @column.dateTime()
  public completedAt: DateTime | null

  @column.dateTime()
  public cancelledAt: DateTime | null

  @column.dateTime()
  public lastChangedAt: DateTime | null

  @column()
  public changeCount: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeCreate()
  public static generateBookingNo(booking: Booking) {
    const now = DateTime.now()
    const random = Math.floor(100000 + Math.random() * 900000)
    booking.bookingNo = `QY${now.toFormat('yyyyMMddHHmmss')}${random}`
  }

  @belongsTo(() => Customer)
  public customer: BelongsTo<typeof Customer>

  @belongsTo(() => TimeSlot)
  public timeSlot: BelongsTo<typeof TimeSlot>

  @belongsTo(() => Staff)
  public staff: BelongsTo<typeof Staff>

  @belongsTo(() => Service)
  public service: BelongsTo<typeof Service>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  public creator: BelongsTo<typeof User>

  @hasMany(() => BookingAttachment)
  public attachments: HasMany<typeof BookingAttachment>

  @hasMany(() => BookingNote)
  public notes: HasMany<typeof BookingNote>

  @hasMany(() => ChangeHistory)
  public changeHistories: HasMany<typeof ChangeHistory>

  @hasMany(() => ExceptionTodo)
  public exceptionTodos: HasMany<typeof ExceptionTodo>
}
