import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'reworks'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('work_order_id').unsigned().notNullable().references('id').inTable('work_orders').onDelete('CASCADE')
      table.integer('schedule_id').unsigned().nullable().references('id').inTable('schedules').onDelete('SET NULL')
      table.integer('quantity').notNullable().defaultTo(0)
      table.enum('reason', [
        'quality_issue',
        'material_defect',
        'process_error',
        'design_change',
        'customer_request',
        'other',
      ]).notNullable()
      table.text('description').nullable()
      table.string('rework_process', 200).nullable()
      table.integer('handled_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.enum('status', ['pending', 'reworking', 'completed', 'scrapped']).notNullable().defaultTo('pending')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.index('work_order_id')
      table.index('reason')
      table.index('status')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
