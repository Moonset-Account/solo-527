import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Equipment from '#models/equipment'

export default class EquipmentAlert extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare equipmentId: string

  @column()
  declare alertType: 'maintenance_due' | 'calibration_expired' | 'malfunction'

  @column()
  declare message: string

  @column()
  declare status: 'pending' | 'confirmed_by_admin' | 'confirmed_by_owner' | 'resolved'

  @column()
  declare confirmedByAdmin: boolean

  @column()
  declare confirmedByOwner: boolean

  @column.dateTime()
  declare adminConfirmedAt: DateTime | null

  @column.dateTime()
  declare ownerConfirmedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Equipment)
  declare equipment: BelongsTo<typeof Equipment>
}
