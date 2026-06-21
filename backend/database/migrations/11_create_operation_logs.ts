import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'operation_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('user_id').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.string('action', 100).notNullable()
      table.string('resource_type', 100).nullable()
      table.bigInteger('resource_id').unsigned().nullable()
      table.string('ip_address', 45).nullable()
      table.string('user_agent').nullable()
      table.jsonb('old_values').notNullable().defaultTo('{}')
      table.jsonb('new_values').notNullable().defaultTo('{}')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('user_id')
      table.index('action')
      table.index('resource_type')
      table.index(['resource_type', 'resource_id'])
      table.index('created_at')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
