import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import WorkOrder from './WorkOrder'
import User from './User'

export default class Schedule extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public workOrderId: number

  @column.date()
  public scheduleDate: DateTime

  @column()
  public workshop: string | null = null

  @column()
  public line: string | null = null

  @column()
  public plannedQuantity: number

  @column()
  public actualQuantity: number = 0

  @column()
  public shift: 'morning' | 'afternoon' | 'night' | null = null

  @column()
  public notes: string | null = null

  @column()
  public scheduledBy: number | null = null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => WorkOrder)
  public workOrder: BelongsTo<typeof WorkOrder>

  @belongsTo(() => User, { foreignKey: 'scheduledBy' })
  public scheduler: BelongsTo<typeof User>
}
