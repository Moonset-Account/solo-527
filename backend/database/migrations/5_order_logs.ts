import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.integer('operator_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('action', 50).notNullable()
      table.text('content').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index('order_id')
      table.index('operator_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
