import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Inventory from './inventory.js'
import SafetyStock from './safety_stock.js'
import Sale from './sale.js'
import ProcessRecord from './process_record.js'
import Rectification from './rectification.js'

export default class Store extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare code: string

  @column()
  declare address: string | null

  @column()
  declare phone: string | null

  @column()
  declare managerName: string | null

  @column()
  declare isActive: boolean

  @column()
  declare dailyTarget: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasOne(() => User, { foreignKey: 'storeId' })
  declare manager: HasOne<typeof User>

  @hasMany(() => Inventory)
  declare inventories: HasMany<typeof Inventory>

  @hasMany(() => SafetyStock)
  declare safetyStocks: HasMany<typeof SafetyStock>

  @hasMany(() => Sale)
  declare sales: HasMany<typeof Sale>

  @hasMany(() => ProcessRecord)
  declare processRecords: HasMany<typeof ProcessRecord>

  @hasMany(() => Rectification)
  declare rectifications: HasMany<typeof Rectification>
}
