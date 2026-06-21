import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Reagent from '#models/reagent'

export default class ReagentBatch extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare reagentId: string

  @column()
  declare batchNumber: string

  @column()
  declare supplier: string

  @column.date()
  declare productionDate: DateTime | null

  @column.date()
  declare expiryDate: DateTime | null

  @column()
  declare storageLocation: string | null

  @column()
  declare quantity: number

  @column()
  declare unitPrice: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Reagent)
  declare reagent: BelongsTo<typeof Reagent>
}
