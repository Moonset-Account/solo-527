import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, hasOne } from '@adonisjs/lucid/orm'
import User from './user.js'
import Technician from './technician.js'
import Community from './community.js'
import OrderLog from './order_log.js'
import OrderEvaluation from './order_evaluation.js'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderNo: string

  @column()
  declare userId: number

  @column()
  declare technicianId: number | null

  @column()
  declare communityId: number | null

  @column()
  declare deviceType: string

  @column()
  declare faultDescription: string | null

  @column()
  declare faultPhotos: string[]

  @column()
  declare address: string

  @column()
  declare contactName: string

  @column()
  declare contactPhone: string

  @column.dateTime()
  declare appointmentTime: DateTime

  @column()
  declare status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'

  @column()
  declare price: number | null

  @column()
  declare remark: string | null

  @column()
  declare channel: string | null

  @column()
  declare isDemo: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Technician)
  declare technician: BelongsTo<typeof Technician>

  @belongsTo(() => Community)
  declare community: BelongsTo<typeof Community>

  @hasMany(() => OrderLog)
  declare logs: HasMany<typeof OrderLog>

  @hasOne(() => OrderEvaluation)
  declare evaluation: HasOne<typeof OrderEvaluation>
}
