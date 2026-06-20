import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'tour_schedules'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('tour_id').unsigned().references('id').inTable('tours').notNullable()
      table.date('tour_date').notNullable()
      table.time('start_time').notNullable()
      table.time('end_time').nullable()
      table.integer('capacity').notNullable().defaultTo(20)
      table.integer('booked').notNullable().defaultTo(0)
      table.enum('status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']).defaultTo('scheduled')
      table.integer('driver_id').unsigned().references('id').inTable('drivers').nullable()
      table.string('vehicle_plate', 20).nullable()
      table.text('remark').nullable()
      table.index(['tour_id', 'tour_date'])
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
