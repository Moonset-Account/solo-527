import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('sale_id').unsigned().notNullable().references('sales.id').onDelete('CASCADE')
      table.string('product_name', 100).notNullable()
      table.integer('quantity').notNullable().defaultTo(0)
      table.decimal('unit_price', 12, 2).notNullable().defaultTo(0)
      table.decimal('subtotal', 12, 2).notNullable().defaultTo(0)
      table.decimal('cost', 12, 2).notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['sale_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
