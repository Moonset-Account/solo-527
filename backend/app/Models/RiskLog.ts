import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import WorkOrder from './WorkOrder'
import User from './User'

export default class RiskLog extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public workOrderId: number

  @column()
  public riskLevel: 'low' | 'medium' | 'high' | 'critical'

  @column()
  public riskType: string

  @column()
  public description: string | null

  @column()
  public actionTaken: string | null

  @column()
  public actionBy: number | null

  @column.dateTime()
  public actionAt: DateTime | null

  @column()
  public status: 'open' | 'mitigated' | 'resolved' | 'closed'

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => WorkOrder)
  public workOrder: BelongsTo<typeof WorkOrder>

  @belongsTo(() => User, { foreignKey: 'actionBy' })
  public actor: BelongsTo<typeof User>
}
