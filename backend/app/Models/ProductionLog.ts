import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import WorkOrder from './WorkOrder'
import Schedule from './Schedule'
import User from './User'

export default class ProductionLog extends BaseModel {
  @column({ isPrimary: true })
  public id!: number

  @column()
  public workOrderId!: number

  @column()
  public scheduleId: number | null = null

  @column.date()
  public productionDate!: DateTime

  @column()
  public outputQuantity: number = 0

  @column()
  public defectQuantity: number = 0

  @column()
  public workHours: number = 0

  @column()
  public manHours: number = 0

  @column()
  public operatorCount: number = 0

  @column()
  public shift: string | null = null

  @column()
  public workshop: string | null = null

  @column()
  public recordedBy: number | null = null

  @column()
  public remarks: string | null = null

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  @belongsTo(() => WorkOrder)
  public workOrder!: BelongsTo<typeof WorkOrder>

  @belongsTo(() => Schedule)
  public schedule!: BelongsTo<typeof Schedule>

  @belongsTo(() => User, { foreignKey: 'recordedBy' })
  public recorder!: BelongsTo<typeof User>
}
