import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class BillingCycle extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({ columnName: 'cycle_type' })
  declare cycleType: string

  @column({ columnName: 'day_of_month' })
  declare dayOfMonth: number | null

  @column({ columnName: 'is_default' })
  declare isDefault: boolean

  @column()
  declare status: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
