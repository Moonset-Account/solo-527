import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class ConfigDictionary extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public dictType: string

  @column()
  public dictKey: string

  @column()
  public dictValue: string

  @column()
  public label: string

  @column()
  public sortOrder: number

  @column()
  public description: string | null

  @column()
  public isEnabled: boolean

  @column()
  public color: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
