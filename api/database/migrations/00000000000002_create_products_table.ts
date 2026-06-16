import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 255).notNullable()
      table.string('sku', 100).notNullable().unique()
      table.string('category', 100).notNullable()
      table.string('brand', 100).nullable()
      table.text('description').nullable()
      table.string('unit', 20).notNullable().defaultTo('件')
      table.decimal('cost_price', 12, 2).notNullable().defaultTo(0)
      table.decimal('retail_price', 12, 2).notNullable().defaultTo(0)
      table.integer('current_stock').notNullable().defaultTo(0)
      table.integer('safety_stock').notNullable().defaultTo(0)
      table.integer('max_stock').notNullable().defaultTo(0)
      table.string('status', 20).notNullable().defaultTo('active')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
