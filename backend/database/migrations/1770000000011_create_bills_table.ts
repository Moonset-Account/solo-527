import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bills'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.string('bill_no').unique().notNullable()
      table.bigint('seat_id').notNullable().references('id').inTable('seats').onDelete('RESTRICT')
      table.string('customer_id').notNullable()
      table.string('customer_name').notNullable()
      table.string('plan_name').notNullable()
      table.string('billing_month').notNullable()
      table.date('period_start').notNullable()
      table.date('period_end').notNullable()
      table.decimal('amount', 10, 2).notNullable()
      table.integer('api_calls_used').notNullable().defaultTo(0)
      table.string('status').notNullable().defaultTo('draft')
      table.date('due_date').nullable()
      table.timestamp('paid_at').nullable()
      table.text('remark').nullable()
      table.bigint('created_by').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index('seat_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
