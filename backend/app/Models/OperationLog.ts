import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class OperationLog extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: number | null

  @column()
  public action: string

  @column()
  public module: string

  @column()
  public resourceType: string | null

  @column()
  public resourceId: number | null

  @column()
  public oldValue: string | null

  @column()
  public newValue: string | null

  @column()
  public ipAddress: string | null

  @column()
  public userAgent: string | null

  @column()
  public isRiskRelated: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>
}
