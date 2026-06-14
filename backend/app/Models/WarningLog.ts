import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class WarningLog extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public warningType: string

  @column()
  public level: string

  @column()
  public title: string

  @column()
  public content: string | null

  @column()
  public relatedId: number | null

  @column()
  public relatedType: string | null

  @column()
  public status: string

  @column()
  public handledBy: number | null

  @column.dateTime()
  public handledAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'handledBy' })
  public handler: BelongsTo<typeof User>
}
