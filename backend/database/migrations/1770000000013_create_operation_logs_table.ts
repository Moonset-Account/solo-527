import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'operation_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.bigint('user_id').nullable()
      table.string('user_name').nullable()
      table.string('action').notNullable()
      table.string('resource_type').notNullable()
      table.bigint('resource_id').nullable()
      table.string('ip_address').nullable()
      table.text('user_agent').nullable()
      table.specificType('details', 'jsonb').nullable()

      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
