import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Staff from './Staff'

export default class StaffSchedule extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public staffId: number

  @column()
  public scheduleDate: DateTime

  @column()
  public startTime: string

  @column()
  public endTime: string

  @column()
  public isDayOff: boolean

  @column()
  public note: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Staff)
  public staff: BelongsTo<typeof Staff>
}
