import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_movements'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE')
      table.string('type', 20).notNullable()
      table.integer('quantity').notNullable()
      table.integer('before_stock').notNullable()
      table.integer('after_stock').notNullable()
      table.string('reason', 255).nullable()
      table.integer('operator_id').unsigned().notNullable().references('id').inTable('users')
      table.integer('appointment_id').unsigned().nullable().references('id').inTable('appointments')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
