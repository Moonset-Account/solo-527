import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import WorkOrder from './WorkOrder'
import Schedule from './Schedule'
import User from './User'

export default class Rework extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public workOrderId: number

  @column()
  public scheduleId: number | null

  @column()
  public quantity: number

  @column()
  public reason: 'quality_issue' | 'material_defect' | 'process_error' | 'design_change' | 'customer_request' | 'other'

  @column()
  public description: string | null

  @column()
  public reworkProcess: string | null

  @column()
  public handledBy: number | null

  @column()
  public status: 'pending' | 'reworking' | 'completed' | 'scrapped'

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => WorkOrder)
  public workOrder: BelongsTo<typeof WorkOrder>

  @belongsTo(() => Schedule)
  public schedule: BelongsTo<typeof Schedule>

  @belongsTo(() => User, { foreignKey: 'handledBy' })
  public handler: BelongsTo<typeof User>
}
