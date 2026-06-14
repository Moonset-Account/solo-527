import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class ReminderConfig extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public reminderType: string

  @column()
  public label: string

  @column()
  public frequencyMinutes: number

  @column()
  public isEnabled: boolean

  @column()
  public sendEmail: boolean

  @column()
  public sendSms: boolean

  @column()
  public sendInApp: boolean

  @column()
  public customMessage: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
