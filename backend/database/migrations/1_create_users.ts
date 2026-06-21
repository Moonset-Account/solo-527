import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.string('username', 50).notNullable().unique()
      table.string('email', 255).notNullable().unique()
      table.string('password').notNullable()
      table.string('full_name', 100).notNullable()
      table.enum('role', ['admin', 'ops', 'sales']).notNullable().defaultTo('sales')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('remember_me_token_expires_at').nullable()
    })

    this.schema.createTable('remember_me_tokens', (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('tokenable_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.string('hash', 255).notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('expires_at').notNullable()
    })

    this.schema.createTable('auth_access_tokens', (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('tokenable_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.string('type', 50).notNullable()
      table.string('name', 255).nullable()
      table.string('hash', 255).notNullable()
      table.text('abilities').notNullable().defaultTo('[]')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()
    })
  }

  async down() {
    this.schema.dropTableIfExists('auth_access_tokens')
    this.schema.dropTableIfExists('remember_me_tokens')
    this.schema.dropTableIfExists(this.tableName)
  }
}
