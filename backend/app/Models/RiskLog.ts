import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import WorkOrder from './WorkOrder'
import User from './User'

export default class RiskLog extends BaseModel {
  @column({ isPrimary: true })
  public id!: number

  @column()
  public workOrderId!: number

  @column()
  public riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'

  @column()
  public riskType!: string

  @column()
  public description: string | null = null

  @column()
  public actionTaken: string | null = null

  @column()
  public actionBy: number | null = null

  @column.dateTime()
  public actionAt: DateTime | null = null

  @column()
  public status: 'open' | 'mitigated' | 'resolved' | 'closed' = 'open'

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  @belongsTo(() => WorkOrder)
  public workOrder!: BelongsTo<typeof WorkOrder>

  @belongsTo(() => User, { foreignKey: 'actionBy' })
  public actor!: BelongsTo<typeof User>
}
