import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import {
  column,
  beforeSave,
  BaseModel,
  manyToMany,
  ManyToMany,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Role from './Role'
import WorkOrder from './WorkOrder'
import Schedule from './Schedule'

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
  public realName: string

  @column()
  public phone: string | null = null

  @column()
  public department: string | null = null

  @column()
  public isActive: boolean = true

  @column()
  public rememberMeToken: string | null = null

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

  @manyToMany(() => Role)
  public roles: ManyToMany<typeof Role>

  @hasMany(() => WorkOrder, { foreignKey: 'assignedTo' })
  public assignedWorkOrders: HasMany<typeof WorkOrder>

  @hasMany(() => WorkOrder, { foreignKey: 'createdBy' })
  public createdWorkOrders: HasMany<typeof WorkOrder>

  @hasMany(() => Schedule, { foreignKey: 'scheduledBy' })
  public schedules: HasMany<typeof Schedule>

  public async hasRole(slug: string): Promise<boolean> {
    const roles = await this.related('roles').query()
    return roles.some((role) => role.slug === slug)
  }

  public async isAdmin(): Promise<boolean> {
    return this.hasRole('admin')
  }

  public async isWorkshopManager(): Promise<boolean> {
    return this.hasRole('workshop_manager')
  }
}
