import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'exceptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('store_id').unsigned().notNullable().references('stores.id').onDelete('CASCADE')
      table.enum('type', ['loss', 'damage', 'complaint', 'equipment', 'other']).notNullable()
      table.integer('loss_reason_id').unsigned().nullable().references('loss_reasons.id').onDelete('SET NULL')
      table.string('title', 200).notNullable()
      table.text('description').notNullable()
      table.decimal('loss_amount', 12, 2).nullable().defaultTo(0)
      table.integer('ingredient_id').unsigned().nullable().references('ingredients.id').onDelete('SET NULL')
      table.decimal('ingredient_quantity', 12, 2).nullable()
      table.enum('status', ['pending', 'processing', 'resolved', 'closed']).notNullable().defaultTo('pending')
      table.text('handling_result').nullable()
      table.integer('created_by').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.integer('handled_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.timestamp('handled_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['store_id', 'status'])
      table.index(['store_id', 'type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
