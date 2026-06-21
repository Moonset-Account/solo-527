import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Requisition from '#models/requisition'
import Reagent from '#models/reagent'

export default class RequisitionItem extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare requisitionId: string

  @column()
  declare reagentId: string

  @column()
  declare quantity: number

  @column()
  declare unitPrice: number

  @belongsTo(() => Requisition)
  declare requisition: BelongsTo<typeof Requisition>

  @belongsTo(() => Reagent)
  declare reagent: BelongsTo<typeof Reagent>
}
