import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import Order from './order.js'
import AttendanceRecord from './attendance_record.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Technician extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare name: string

  @column()
  declare phone: string

  @column()
  declare skills: string[]

  @column()
  declare status: 'active' | 'inactive' | 'on_leave'

  @column()
  declare dailyLimit: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Order)
  declare orders: HasMany<typeof Order>

  @hasMany(() => AttendanceRecord)
  declare attendanceRecords: HasMany<typeof AttendanceRecord>
}
