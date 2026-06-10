import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'production_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('work_order_id').unsigned().notNullable().references('id').inTable('work_orders').onDelete('CASCADE')
      table.integer('schedule_id').unsigned().nullable().references('id').inTable('schedules').onDelete('SET NULL')
      table.date('production_date').notNullable()
      table.integer('output_quantity').notNullable().defaultTo(0)
      table.integer('defect_quantity').notNullable().defaultTo(0)
      table.decimal('work_hours', 8, 2).notNullable().defaultTo(0)
      table.decimal('man_hours', 8, 2).notNullable().defaultTo(0)
      table.integer('operator_count').notNullable().defaultTo(0)
      table.string('shift', 20).nullable()
      table.string('workshop', 100).nullable()
      table.integer('recorded_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.text('remarks').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.index('work_order_id')
      table.index('production_date')
      table.index('workshop')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
