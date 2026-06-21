import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import ReagentBatch from '#models/reagent_batch'

export default class Reagent extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare casNumber: string | null

  @column()
  declare category: string

  @column()
  declare dangerLevel: 'normal' | 'hazardous' | 'highly_hazardous'

  @column()
  declare storageCondition: string | null

  @column()
  declare unit: string

  @column()
  declare unitPrice: number

  @column()
  declare totalQuantity: number

  @column()
  declare warningThreshold: number

  @column()
  declare isControlled: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => ReagentBatch)
  declare batches: HasMany<typeof ReagentBatch>
}
