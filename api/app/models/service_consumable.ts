import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Service from './service.js'
import Product from './product.js'

export default class ServiceConsumable extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare serviceId: number

  @column()
  declare productId: number

  @column.decimal()
  declare quantity: number

  @column()
  declare unit: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Service)
  declare service: BelongsTo<typeof Service>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
