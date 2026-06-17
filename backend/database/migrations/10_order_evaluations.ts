import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_evaluations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('order_id').unsigned().notNullable().unique().references('id').inTable('orders').onDelete('CASCADE')
      table.integer('rating').notNullable().checkBetween([1, 5])
      table.text('content').nullable()
      table.boolean('is_repurchase').notNullable().defaultTo(false)
      table.string('channel', 50).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index('order_id')
      table.index('rating')
      table.index('is_repurchase')
      table.index('channel')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
