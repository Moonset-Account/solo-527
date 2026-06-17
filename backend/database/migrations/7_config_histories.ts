import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'config_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('config_key', 100).notNullable()
      table.text('old_value').nullable()
      table.text('new_value').nullable()
      table.string('change_reason', 255).nullable()
      table.integer('operator_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index('config_key')
      table.index('operator_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
