import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import WorkOrder from './WorkOrder'
import Material from './Material'

export default class WorkOrderMaterial extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public workOrderId: number

  @column()
  public materialId: number

  @column()
  public requiredQuantity: number = 0

  @column()
  public allocatedQuantity: number = 0

  @column()
  public usedQuantity: number = 0

  @column()
  public isReady: boolean = false

  @column()
  public remarks: string | null = null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => WorkOrder)
  public workOrder: BelongsTo<typeof WorkOrder>

  @belongsTo(() => Material)
  public material: BelongsTo<typeof Material>
}
