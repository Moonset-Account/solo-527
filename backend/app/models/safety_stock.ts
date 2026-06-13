import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Store from './store.js'
import Ingredient from './ingredient.js'

export default class SafetyStock extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare storeId: number

  @column()
  declare ingredientId: number

  @column()
  declare minQuantity: number

  @column()
  declare maxQuantity: number

  @column()
  declare warningQuantity: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Store)
  declare store: BelongsTo<typeof Store>

  @belongsTo(() => Ingredient)
  declare ingredient: BelongsTo<typeof Ingredient>
}
