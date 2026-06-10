import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import WorkOrder from './WorkOrder'
import Schedule from './Schedule'
import User from './User'

export default class ProductionLog extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public workOrderId: number

  @column()
  public scheduleId: number | null

  @column.date()
  public productionDate: DateTime

  @column()
  public outputQuantity: number

  @column()
  public defectQuantity: number

  @column()
  public workHours: number

  @column()
  public manHours: number

  @column()
  public operatorCount: number

  @column()
  public shift: string | null

  @column()
  public workshop: string | null

  @column()
  public recordedBy: number | null

  @column()
  public remarks: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => WorkOrder)
  public workOrder: BelongsTo<typeof WorkOrder>

  @belongsTo(() => Schedule)
  public schedule: BelongsTo<typeof Schedule>

  @belongsTo(() => User, { foreignKey: 'recordedBy' })
  public recorder: BelongsTo<typeof User>
}
