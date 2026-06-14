import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class RevisionHistory extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public entityType: string

  @column()
  public entityId: number

  @column()
  public revisionRound: number

  @column()
  public userId: number | null

  @column()
  public beforeData: object | null

  @column()
  public afterData: object | null

  @column()
  public changeDescription: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  public operator: BelongsTo<typeof User>
}
