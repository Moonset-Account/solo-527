import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'process_records'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('store_id').unsigned().notNullable().references('stores.id').onDelete('CASCADE')
      table.enum('type', ['inspection', 'cash_flow', 'inventory_log', 'other']).notNullable()
      table.string('title', 200).notNullable()
      table.text('description').nullable()
      table.jsonb('data').nullable()

      table.integer('related_id').unsigned().nullable()
      table.string('related_type', 50).nullable()

      table.decimal('amount', 12, 2).nullable()

      table.enum('status', ['pending', 'processing', 'completed', 'cancelled']).notNullable().defaultTo('completed')

      table.integer('created_by').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.integer('handled_by').unsigned().nullable().references('users.id').onDelete('SET NULL')

      table.timestamp('handled_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['store_id', 'type'])
      table.index(['store_id', 'created_at'])
      table.index(['created_by'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
