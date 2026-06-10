import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from './User'

export default class OperationLog extends BaseModel {
  @column({ isPrimary: true })
  public id!: number

  @column()
  public userId: number | null = null

  @column()
  public action!: string

  @column()
  public module!: string

  @column()
  public resourceType: string | null = null

  @column()
  public resourceId: number | null = null

  @column()
  public oldValue: string | null = null

  @column()
  public newValue: string | null = null

  @column()
  public ipAddress: string | null = null

  @column()
  public userAgent: string | null = null

  @column()
  public isRiskRelated: boolean = false

  @column.dateTime({ autoCreate: true })
  public createdAt!: DateTime

  @belongsTo(() => User)
  public user!: BelongsTo<typeof User>
}
