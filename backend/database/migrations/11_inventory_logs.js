import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('schedule_id').unsigned().references('id').inTable('tour_schedules').notNullable()
      table.enum('change_type', ['order', 'cancel', 'refund', 'manual', 'system']).notNullable()
      table.integer('change_quantity').notNullable()
      table.integer('before_quantity').notNullable()
      table.integer('after_quantity').notNullable()
      table.integer('order_id').unsigned().references('id').inTable('orders').nullable()
      table.integer('order_item_id').unsigned().references('id').inTable('order_items').nullable()
      table.integer('operator_id').unsigned().references('id').inTable('users').nullable()
      table.text('remark').nullable()
      table.string('change_reason', 200).nullable()
      table.index('schedule_id')
      table.index('change_type')
      table.index('order_id')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
