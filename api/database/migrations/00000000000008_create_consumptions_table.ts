import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'consumptions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('appointment_item_id').unsigned().notNullable().references('id').inTable('appointment_items').onDelete('CASCADE')
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products')
      table.decimal('quantity', 10, 2).notNullable()
      table.string('unit', 20).notNullable().defaultTo('件')
      table.integer('operator_id').unsigned().notNullable().references('id').inTable('users')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
