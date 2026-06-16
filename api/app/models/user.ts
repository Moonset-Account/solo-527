import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins'
import Appointmet from './appointment.js'
import ChangeLog from './change_log.js'
import RestockAlert from './restock_alert.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare fullName: string

  @column()
  declare role: string

  @column()
  declare phone: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Appointmet, { foreignKey: 'consultantId' })
  declare appointments: HasMany<typeof Appointmet>

  @hasMany(() => ChangeLog, { foreignKey: 'changedBy' })
  declare changeLogs: HasMany<typeof ChangeLog>

  @hasMany(() => RestockAlert, { foreignKey: 'createdBy' })
  declare restockAlerts: HasMany<typeof RestockAlert>
}
