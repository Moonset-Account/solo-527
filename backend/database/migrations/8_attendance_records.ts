import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendance_records'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('technician_id').unsigned().notNullable().references('id').inTable('technicians').onDelete('CASCADE')
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.timestamp('scheduled_time', { useTz: true }).notNullable()
      table.timestamp('actual_arrival_time', { useTz: true }).nullable()
      table.text('late_reason').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index('technician_id')
      table.index('order_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
