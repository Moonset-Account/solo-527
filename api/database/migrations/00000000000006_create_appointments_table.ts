import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'appointments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('customer_name', 255).notNullable()
      table.string('customer_phone', 20).notNullable()
      table.integer('consultant_id').unsigned().notNullable().references('id').inTable('users')
      table.date('appointment_date').notNullable()
      table.time('start_time').notNullable()
      table.time('end_time').notNullable()
      table.string('status', 20).notNullable().defaultTo('scheduled')
      table.text('notes').nullable()
      table.decimal('total_amount', 12, 2).notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
