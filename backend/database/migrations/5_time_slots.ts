import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class TimeSlots extends BaseSchema {
  protected tableName = 'time_slots'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.date('slot_date').notNullable()
      table.string('start_time', 8).notNullable()
      table.string('end_time', 8).notNullable()
      table.integer('staff_id').unsigned().references('id').inTable('staff').onDelete('CASCADE')
      table.integer('service_id').unsigned().references('id').inTable('services').onDelete('CASCADE')
      table.integer('capacity').notNullable().defaultTo(1)
      table.integer('booked_count').notNullable().defaultTo(0)
      table.string('status', 20).notNullable().defaultTo('available')
      table.index(['slot_date', 'staff_id'])
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
