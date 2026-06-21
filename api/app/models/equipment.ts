import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import EquipmentAlert from '#models/equipment_alert'

export default class Equipment extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare code: string

  @column()
  declare status: 'active' | 'inactive' | 'maintenance'

  @column()
  declare ownerId: string | null

  @column()
  declare utilizationRate: number

  @column.dateTime()
  declare lastMaintenance: DateTime | null

  @column.dateTime()
  declare nextMaintenance: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'ownerId' })
  declare owner: BelongsTo<typeof User>

  @hasMany(() => EquipmentAlert)
  declare alerts: HasMany<typeof EquipmentAlert>
}
