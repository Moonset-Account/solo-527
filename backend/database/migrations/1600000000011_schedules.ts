import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'schedules'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('work_order_id').unsigned().notNullable().references('id').inTable('work_orders').onDelete('CASCADE')
      table.date('schedule_date').notNullable()
      table.string('workshop', 100).nullable()
      table.string('line', 50).nullable()
      table.integer('planned_quantity').notNullable().defaultTo(0)
      table.integer('actual_quantity').notNullable().defaultTo(0)
      table.enum('shift', ['morning', 'afternoon', 'night']).nullable()
      table.text('notes').nullable()
      table.integer('scheduled_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.index('work_order_id')
      table.index('schedule_date')
      table.index('workshop')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
