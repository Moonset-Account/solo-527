import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from './product.js'
import User from './user.js'
import Appointmet from './appointment.js'

export default class StockMovement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productId: number

  @column()
  declare type: string

  @column()
  declare quantity: number

  @column()
  declare beforeStock: number

  @column()
  declare afterStock: number

  @column()
  declare reason: string | null

  @column()
  declare operatorId: number

  @column()
  declare appointmentId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => User, { foreignKey: 'operatorId' })
  declare operator: BelongsTo<typeof User>

  @belongsTo(() => Appointmet)
  declare appointment: BelongsTo<typeof Appointmet>
}
