import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Bookings extends BaseSchema {
  protected tableName = 'bookings'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('booking_no', 32).notNullable().unique()
      table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('CASCADE')
      table.integer('time_slot_id').unsigned().references('id').inTable('time_slots').onDelete('CASCADE')
      table.integer('staff_id').unsigned().references('id').inTable('staff').onDelete('CASCADE')
      table.integer('service_id').unsigned().references('id').inTable('services').onDelete('CASCADE')
      table.date('booking_date').notNullable()
      table.string('start_time', 8).notNullable()
      table.string('end_time', 8).notNullable()
      table.string('status', 20).notNullable().defaultTo('pending')
      table.decimal('amount', 10, 2).notNullable().defaultTo(0)
      table.string('payment_status', 20).notNullable().defaultTo('unpaid')
      table.boolean('is_no_show').notNullable().defaultTo(false)
      table.string('source', 30).notNullable().defaultTo('front_desk')
      table.text('remark').nullable()
      table.integer('created_by').unsigned().references('id').inTable('users').nullable()
      table.timestamp('paid_at', { useTz: true }).nullable()
      table.timestamp('arrived_at', { useTz: true }).nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()
      table.timestamp('cancelled_at', { useTz: true }).nullable()
      table.timestamp('last_changed_at', { useTz: true }).nullable()
      table.integer('change_count').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.index(['booking_date', 'status'])
      table.index(['customer_id', 'status'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
