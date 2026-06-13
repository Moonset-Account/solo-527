import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Inventory from './inventory.js'
import SafetyStock from './safety_stock.js'

export default class Ingredient extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare code: string

  @column()
  declare category: string | null

  @column()
  declare unit: string

  @column()
  declare unitPrice: number

  @column()
  declare specification: string | null

  @column()
  declare isActive: boolean

  @column()
  declare remark: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Inventory)
  declare inventories: HasMany<typeof Inventory>

  @hasMany(() => SafetyStock)
  declare safetyStocks: HasMany<typeof SafetyStock>
}
