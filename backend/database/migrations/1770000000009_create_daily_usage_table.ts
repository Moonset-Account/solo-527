import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'daily_usage'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.bigint('seat_id').notNullable().references('id').inTable('seats').onDelete('CASCADE')
      table.date('stat_date').notNullable()
      table.integer('total_calls').notNullable().defaultTo(0)
      table.integer('success_calls').notNullable().defaultTo(0)
      table.integer('error_calls').notNullable().defaultTo(0)
      table.decimal('avg_response_time', 10, 2).nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['seat_id', 'stat_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
