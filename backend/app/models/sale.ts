import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Store from './store.js'
import SaleItem from './sale_item.js'
import User from './user.js'

export default class Sale extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare storeId: number

  @column.date()
  declare saleDate: DateTime

  @column()
  declare totalAmount: number

  @column()
  declare orderCount: number

  @column()
  declare costAmount: number

  @column()
  declare profitAmount: number

  @column()
  declare discountAmount: number

  @column()
  declare remark: string | null

  @column()
  declare createdBy: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Store)
  declare store: BelongsTo<typeof Store>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @hasMany(() => SaleItem)
  declare items: HasMany<typeof SaleItem>
}
