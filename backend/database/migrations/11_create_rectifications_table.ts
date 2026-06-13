import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rectifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('store_id').unsigned().notNullable().references('stores.id').onDelete('CASCADE')
      table.integer('source_id').unsigned().nullable()
      table.string('source_type', 50).nullable()
      table.string('title', 200).notNullable()
      table.text('description').notNullable()
      table.enum('level', ['low', 'medium', 'high', 'critical']).notNullable().defaultTo('medium')
      table.enum('status', ['pending', 'in_progress', 'resolved', 'closed', 'overdue']).notNullable().defaultTo('pending')
      table.timestamp('deadline').nullable()
      table.text('handling_result').nullable()
      table.text('remark').nullable()
      table.integer('created_by').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.integer('assigned_to').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.integer('closed_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.timestamp('closed_at').nullable()
      table.boolean('is_closed_loop').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.index(['store_id', 'status'])
      table.index(['store_id', 'deadline'])
      table.index(['assigned_to', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
