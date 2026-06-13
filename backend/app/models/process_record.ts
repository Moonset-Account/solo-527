import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Store from './store.js'
import User from './user.js'

export default class ProcessRecord extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare storeId: number

  @column()
  declare type: 'inspection' | 'cash_flow' | 'inventory_log' | 'other'

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare data: Record<string, any> | null

  @column()
  declare relatedId: number | null

  @column()
  declare relatedType: string | null

  @column()
  declare amount: number | null

  @column()
  declare status: 'pending' | 'processing' | 'completed' | 'cancelled'

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

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'handledBy' })
  declare handler: BelongsTo<typeof User>
}
