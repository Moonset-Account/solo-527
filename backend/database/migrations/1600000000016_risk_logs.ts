import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'risk_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('work_order_id').unsigned().notNullable().references('id').inTable('work_orders').onDelete('CASCADE')
      table.enum('risk_level', ['low', 'medium', 'high', 'critical']).notNullable()
      table.string('risk_type', 100).notNullable()
      table.text('description').nullable()
      table.text('action_taken').nullable()
      table.integer('action_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('action_at', { useTz: true }).nullable()
      table.enum('status', ['open', 'mitigated', 'resolved', 'closed']).notNullable().defaultTo('open')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.index('work_order_id')
      table.index('risk_level')
      table.index('status')
      table.index('created_at')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
