import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Store from './store.js'
import Ingredient from './ingredient.js'

export default class Inventory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare storeId: number

  @column()
  declare ingredientId: number

  @column()
  declare quantity: number

  @column()
  declare avgCost: number

  @column()
  declare totalValue: number

  @column.dateTime()
  declare lastCountAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Store)
  declare store: BelongsTo<typeof Store>

  @belongsTo(() => Ingredient)
  declare ingredient: BelongsTo<typeof Ingredient>
}
