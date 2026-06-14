import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave, BaseModel, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import BrandPartnership from './BrandPartnership'
import Order from './Order'
import Subscription from './Subscription'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public username: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public avatarUrl: string | null

  @column()
  public role: 'admin' | 'operator' | 'finance' | 'video_team'

  @column()
  public isActive: boolean

  @column()
  public rememberMeToken: string | null

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

  @hasMany(() => BrandPartnership, { foreignKey: 'responsibleUserId' })
  public partnerships: HasMany<typeof BrandPartnership>

  @hasMany(() => Order, { foreignKey: 'userId' })
  public orders: HasMany<typeof Order>

  @hasMany(() => Subscription, { foreignKey: 'userId' })
  public subscriptions: HasMany<typeof Subscription>
}
