import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Store from './store.js'
import User from './user.js'
import RectificationNote from './rectification_note.js'

export default class Rectification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare storeId: number

  @column()
  declare sourceId: number | null

  @column()
  declare sourceType: string | null

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare level: 'low' | 'medium' | 'high' | 'critical'

  @column()
  declare status: 'pending' | 'in_progress' | 'resolved' | 'closed' | 'overdue'

  @column.dateTime()
  declare deadline: DateTime | null

  @column()
  declare handlingResult: string | null

  @column()
  declare remark: string | null

  @column()
  declare createdBy: number

  @column()
  declare assignedTo: number | null

  @column()
  declare closedBy: number | null

  @column.dateTime()
  declare closedAt: DateTime | null

  @column()
  declare isClosedLoop: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Store)
  declare store: BelongsTo<typeof Store>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'assignedTo' })
  declare assignee: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'closedBy' })
  declare closer: BelongsTo<typeof User>

  @hasMany(() => RectificationNote)
  declare notes: HasMany<typeof RectificationNote>
}
