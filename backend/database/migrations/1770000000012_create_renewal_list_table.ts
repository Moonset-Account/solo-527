import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'renewal_list'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.bigint('seat_id').unique().notNullable().references('id').inTable('seats').onDelete('CASCADE')
      table.string('customer_id').notNullable()
      table.string('customer_name').notNullable()
      table.string('plan_name').notNullable()
      table.date('expiry_date').notNullable()
      table.string('status').notNullable().defaultTo('pending')
      table.string('priority').notNullable().defaultTo('medium')
      table.bigint('assigned_to').nullable()
      table.timestamp('last_follow_up_at').nullable()
      table.timestamp('next_follow_up_at').nullable()
      table.text('notes').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
