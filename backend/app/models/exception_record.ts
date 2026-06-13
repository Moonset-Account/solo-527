import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Store from './store.js'
import LossReason from './loss_reason.js'
import Ingredient from './ingredient.js'
import User from './user.js'

export default class ExceptionRecord extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare storeId: number

  @column()
  declare type: 'loss' | 'damage' | 'complaint' | 'equipment' | 'other'

  @column()
  declare lossReasonId: number | null

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare lossAmount: number | null

  @column()
  declare ingredientId: number | null

  @column()
  declare ingredientQuantity: number | null

  @column()
  declare status: 'pending' | 'processing' | 'resolved' | 'closed'

  @column()
  declare handlingResult: string | null

  @column()
  declare createdBy: number

  @column()
  declare handledBy: number | null

  @column.dateTime()
  declare handledAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Store)
  declare store: BelongsTo<typeof Store>

  @belongsTo(() => LossReason)
  declare lossReason: BelongsTo<typeof LossReason>

  @belongsTo(() => Ingredient)
  declare ingredient: BelongsTo<typeof Ingredient>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'handledBy' })
  declare handler: BelongsTo<typeof User>
}
