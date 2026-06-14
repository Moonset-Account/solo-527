import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'refund_exceptions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE')
      table.integer('subscription_id').unsigned().references('id').inTable('subscriptions').onDelete('SET NULL').nullable()
      table.string('exception_type', 50).notNullable()
      table.string('status', 20).defaultTo('pending')
      table.decimal('refund_amount', 14, 2).notNullable()
      table.string('reason', 255)
      table.text('description')
      table.integer('reported_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.integer('handler_id').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.text('handler_conclusion')
      table.timestamp('handled_at', { useTz: true })
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
