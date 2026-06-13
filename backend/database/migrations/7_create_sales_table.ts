import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('store_id').unsigned().notNullable().references('stores.id').onDelete('CASCADE')
      table.date('sale_date').notNullable()
      table.decimal('total_amount', 12, 2).notNullable().defaultTo(0)
      table.integer('order_count').notNullable().defaultTo(0)
      table.decimal('cost_amount', 12, 2).notNullable().defaultTo(0)
      table.decimal('profit_amount', 12, 2).notNullable().defaultTo(0)
      table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0)
      table.text('remark').nullable()
      table.integer('created_by').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['store_id', 'sale_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
