import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seats'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.string('customer_id').notNullable().index()
      table.string('customer_name').notNullable()
      table.bigint('plan_id').notNullable().references('id').inTable('plans').onDelete('RESTRICT')
      table.string('seat_code').unique().notNullable()
      table.string('status').notNullable().defaultTo('trial')
      table.string('billing_cycle').notNullable().defaultTo('monthly')
      table.string('api_key').unique().nullable()
      table.integer('api_calls_used').notNullable().defaultTo(0)
      table.integer('api_calls_limit').notNullable()
      table.timestamp('start_date').notNullable()
      table.timestamp('end_date').nullable()
      table.timestamp('trial_end_date').nullable()
      table.boolean('is_idle').notNullable().defaultTo(false)
      table.integer('idle_days').notNullable().defaultTo(0)
      table.timestamp('last_activity_at').nullable()
      table.text('notes').nullable()
      table.bigint('created_by').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index('status')
      table.index('customer_id')
      table.index('is_idle')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
