import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import AppointmentItem from './appointment_item.js'
import Product from './product.js'
import User from './user.js'

export default class Consumption extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare appointmentItemId: number

  @column()
  declare productId: number

  @column.decimal()
  declare quantity: number

  @column()
  declare unit: string

  @column()
  declare operatorId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => AppointmentItem)
  declare appointmentItem: BelongsTo<typeof AppointmentItem>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => User, { foreignKey: 'operatorId' })
  declare operator: BelongsTo<typeof User>
}
