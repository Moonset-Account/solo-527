import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import StockMovement from './stock_movement.js'
import ServiceConsumable from './service_consumable.js'
import Consumption from './consumption.js'
import Evaluation from './evaluation.js'
import RestockAlert from './restock_alert.js'
import Attachment from './attachment.js'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare sku: string

  @column()
  declare category: string

  @column()
  declare brand: string | null

  @column()
  declare description: string | null

  @column()
  declare unit: string

  @column.decimal()
  declare costPrice: number

  @column.decimal()
  declare retailPrice: number

  @column()
  declare currentStock: number

  @column()
  declare safetyStock: number

  @column()
  declare maxStock: number

  @column()
  declare status: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => StockMovement)
  declare stockMovements: HasMany<typeof StockMovement>

  @hasMany(() => ServiceConsumable)
  declare serviceConsumables: HasMany<typeof ServiceConsumable>

  @hasMany(() => Consumption)
  declare consumptions: HasMany<typeof Consumption>

  @hasMany(() => Evaluation)
  declare evaluations: HasMany<typeof Evaluation>

  @hasMany(() => RestockAlert)
  declare restockAlerts: HasMany<typeof RestockAlert>
}
