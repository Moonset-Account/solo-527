import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import hash from '@adonisjs/core/services/hash'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Requisition from '#models/requisition'
import Project from '#models/project'
import PermissionRequest from '#models/permission_request'

const AuthFinder = withAuthFinder(hash, {
  uids: ['username'],
  passwordColumnName: 'password_hash',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare username: string

  @column({ serializeAs: null })
  declare passwordHash: string

  @column()
  declare displayName: string | null

  @column()
  declare role: 'admin' | 'reagent_manager' | 'project_leader' | 'staff'

  @column()
  declare status: 'active' | 'inactive' | 'pending_review'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Requisition, { foreignKey: 'applicantId' })
  declare requisitions: HasMany<typeof Requisition>

  @hasMany(() => Project, { foreignKey: 'principalId' })
  declare projects: HasMany<typeof Project>

  @hasMany(() => PermissionRequest)
  declare permissionRequests: HasMany<typeof PermissionRequest>
}
