import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Booking from './Booking'
import User from './User'

export default class BookingAttachment extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public bookingId: number

  @column()
  public fileName: string

  @column()
  public filePath: string

  @column()
  public fileType: string

  @column()
  public fileSize: number

  @column()
  public uploadedBy: number | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Booking)
  public booking: BelongsTo<typeof Booking>

  @belongsTo(() => User, { foreignKey: 'uploadedBy' })
  public uploader: BelongsTo<typeof User>
}
