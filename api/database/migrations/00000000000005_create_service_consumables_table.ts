import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'service_consumables'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('service_id').unsigned().notNullable().references('id').inTable('services').onDelete('CASCADE')
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE')
      table.decimal('quantity', 10, 2).notNullable().defaultTo(1)
      table.string('unit', 20).notNullable().defaultTo('件')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.unique(['service_id', 'product_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
