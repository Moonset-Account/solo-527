import { DateTime } from 'luxon'
import { BaseModel, column, beforeSave, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Hash from '@ioc:Adonis/Core/Hash'
import ApiToken from './ApiToken'
import Booking from './Booking'
import ExceptionTodo from './ExceptionTodo'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public username: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public realName: string

  @column()
  public role: string

  @column()
  public isActive: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  @hasMany(() => ApiToken)
  public tokens: HasMany<typeof ApiToken>

  @hasMany(() => Booking, { foreignKey: 'createdBy' })
  public createdBookings: HasMany<typeof Booking>

  @hasMany(() => ExceptionTodo, { foreignKey: 'handledBy' })
  public handledTodos: HasMany<typeof ExceptionTodo>
}
