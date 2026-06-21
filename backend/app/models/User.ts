import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, beforeSave, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import EmailDraft from '#models/email_draft'
import KnowledgeItem from '#models/knowledge_item'
import ReviewRecord from '#models/review_record'
import OperationLog from '#models/operation_log'
import CostRecord from '#models/cost_record'
import SpeechTemplate from '#models/speech_template'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email', 'username'],
  passwordColumnName: 'password'
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare fullName: string

  @column()
  declare role: 'admin' | 'ops' | 'sales'

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => EmailDraft, { foreignKey: 'salesId' })
  declare salesDrafts: HasMany<typeof EmailDraft>

  @hasMany(() => EmailDraft, { foreignKey: 'opsId' })
  declare opsDrafts: HasMany<typeof EmailDraft>

  @hasMany(() => KnowledgeItem, { foreignKey: 'createdBy' })
  declare createdKnowledgeItems: HasMany<typeof KnowledgeItem>

  @hasMany(() => ReviewRecord, { foreignKey: 'reviewerId' })
  declare reviewRecords: HasMany<typeof ReviewRecord>

  @hasMany(() => OperationLog, { foreignKey: 'userId' })
  declare operationLogs: HasMany<typeof OperationLog>

  @hasMany(() => CostRecord, { foreignKey: 'userId' })
  declare costRecords: HasMany<typeof CostRecord>

  @hasMany(() => SpeechTemplate, { foreignKey: 'createdBy' })
  declare speechTemplates: HasMany<typeof SpeechTemplate>

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await hash.make(user.password)
    }
  }

  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
