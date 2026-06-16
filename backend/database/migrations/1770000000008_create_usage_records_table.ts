import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'usage_records'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.bigint('seat_id').notNullable().references('id').inTable('seats').onDelete('CASCADE')
      table.string('api_endpoint').notNullable()
      table.string('method').notNullable()
      table.integer('status_code').notNullable()
      table.integer('response_time').nullable()
      table.date('request_date').notNullable().index()
      table.boolean('is_error').notNullable().defaultTo(false)
      table.text('error_message').nullable()

      table.timestamp('created_at').notNullable()

      table.index(['seat_id', 'request_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
