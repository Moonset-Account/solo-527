import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Customers extends BaseSchema {
  protected tableName = 'customers'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 50).notNullable()
      table.string('phone', 20).notNullable()
      table.string('gender', 10).nullable()
      table.integer('age').nullable()
      table.text('medical_history').nullable()
      table.integer('no_show_count').notNullable().defaultTo(0)
      table.integer('total_bookings').notNullable().defaultTo(0)
      table.decimal('no_show_rate', 5, 4).notNullable().defaultTo(0)
      table.timestamp('last_visit', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.index('phone')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
