import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Sale from './sale.js'

export default class SaleItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare saleId: number

  @column()
  declare productName: string

  @column()
  declare quantity: number

  @column()
  declare unitPrice: number

  @column()
  declare subtotal: number

  @column()
  declare cost: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Sale)
  declare sale: BelongsTo<typeof Sale>
}
