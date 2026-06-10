import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, hasMany, HasMany, computed } from '@ioc:Adonis/Lucid/Orm'
import User from './User'
import Schedule from './Schedule'
import WorkOrderMaterial from './WorkOrderMaterial'
import Rework from './Rework'
import ProductionLog from './ProductionLog'
import RiskLog from './RiskLog'

export default class WorkOrder extends BaseModel {
  @column({ isPrimary: true })
  public id!: number

  @column()
  public orderNo!: string

  @column()
  public productName!: string

  @column()
  public productModel: string | null = null

  @column()
  public quantity!: number

  @column()
  public completedQuantity: number = 0

  @column()
  public customerName: string | null = null

  @column()
  public status: 'pending' | 'scheduled' | 'in_production' | 'completed' | 'delayed' | 'cancelled' = 'pending'

  @column()
  public priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'

  @column.date()
  public plannedStartDate: DateTime | null = null

  @column.date()
  public plannedEndDate: DateTime | null = null

  @column.date()
  public actualStartDate: DateTime | null = null

  @column.date()
  public actualEndDate: DateTime | null = null

  @column.date()
  public deliveryDate: DateTime | null = null

  @column()
  public remarks: string | null = null

  @column()
  public assignedTo: number | null = null

  @column()
  public createdBy!: number

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt!: DateTime

  @belongsTo(() => User, { foreignKey: 'assignedTo' })
  public assignee!: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  public creator!: BelongsTo<typeof User>

  @hasMany(() => Schedule)
  public schedules!: HasMany<typeof Schedule>

  @hasMany(() => WorkOrderMaterial)
  public materials!: HasMany<typeof WorkOrderMaterial>

  @hasMany(() => Rework)
  public reworks!: HasMany<typeof Rework>

  @hasMany(() => ProductionLog)
  public productionLogs!: HasMany<typeof ProductionLog>

  @hasMany(() => RiskLog)
  public riskLogs!: HasMany<typeof RiskLog>

  @computed()
  public get completionRate(): number {
    if (this.quantity === 0) return 0
    return Math.round((this.completedQuantity / this.quantity) * 100)
  }

  @computed()
  public get isDelayed(): boolean {
    if (!this.deliveryDate) return false
    const today = DateTime.now()
    return this.deliveryDate < today && this.status !== 'completed' && this.status !== 'cancelled'
  }
}
