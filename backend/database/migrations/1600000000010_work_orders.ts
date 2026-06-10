import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'work_orders'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('order_no', 50).notNullable().unique()
      table.string('product_name', 200).notNullable()
      table.string('product_model', 100).nullable()
      table.integer('quantity').notNullable().defaultTo(0)
      table.integer('completed_quantity').notNullable().defaultTo(0)
      table.string('customer_name', 100).nullable()
      table.enum('status', [
        'pending',
        'scheduled',
        'in_production',
        'completed',
        'delayed',
        'cancelled',
      ]).notNullable().defaultTo('pending')
      table.enum('priority', ['low', 'medium', 'high', 'urgent']).notNullable().defaultTo('medium')
      table.date('planned_start_date').nullable()
      table.date('planned_end_date').nullable()
      table.date('actual_start_date').nullable()
      table.date('actual_end_date').nullable()
      table.date('delivery_date').nullable()
      table.text('remarks').nullable()
      table.integer('assigned_to').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.integer('created_by').unsigned().notNullable().references('id').inTable('users')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.index('status')
      table.index('priority')
      table.index('assigned_to')
      table.index('delivery_date')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
