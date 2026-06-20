import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'order_items'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('order_id').unsigned().references('id').inTable('orders').notNullable()
      table.integer('tour_id').unsigned().references('id').inTable('tours').nullable()
      table.integer('schedule_id').unsigned().references('id').inTable('tour_schedules').nullable()
      table.string('tour_name', 200).notNullable()
      table.date('tour_date').nullable()
      table.time('start_time').nullable()
      table.integer('quantity').notNullable().defaultTo(1)
      table.decimal('unit_price', 10, 2).notNullable()
      table.decimal('subtotal', 10, 2).notNullable()
      table.enum('status', ['active', 'cancelled', 'refunded']).defaultTo('active')
      table.json('travelers').nullable().defaultTo(JSON.stringify([]))
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
