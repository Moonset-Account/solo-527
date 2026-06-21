import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Requisition from '#models/requisition'

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare principalId: string

  @column()
  declare budget: number

  @column()
  declare spent: number

  @column()
  declare status: 'active' | 'completed' | 'suspended'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'principalId' })
  declare principal: BelongsTo<typeof User>

  @hasMany(() => Requisition)
  declare requisitions: HasMany<typeof Requisition>
}
