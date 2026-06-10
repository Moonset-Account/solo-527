import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class StaffSchedules extends BaseSchema {
  protected tableName = 'staff_schedules'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('staff_id').unsigned().references('id').inTable('staff').onDelete('CASCADE')
      table.date('schedule_date').notNullable()
      table.string('start_time', 8).notNullable().defaultTo('09:00')
      table.string('end_time', 8).notNullable().defaultTo('18:00')
      table.boolean('is_day_off').notNullable().defaultTo(false)
      table.string('note', 200).nullable()
      table.index(['staff_id', 'schedule_date'])
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
