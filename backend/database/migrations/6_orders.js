import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('order_no', 50).notNullable().unique()
      table.string('customer_name', 100).notNullable()
      table.string('customer_phone', 20).notNullable()
      table.decimal('total_amount', 10, 2).notNullable().defaultTo(0)
      table.decimal('paid_amount', 10, 2).notNullable().defaultTo(0)
      table.decimal('refund_amount', 10, 2).notNullable().defaultTo(0)
      table.enum('status', [
        'pending_confirmation',
        'confirmed',
        'completed',
        'cancelled',
        'refund_pending',
        'refunded',
        'partially_refunded',
      ]).defaultTo('pending_confirmation')
      table.enum('payment_method', ['cash', 'alipay', 'wechat', 'bank_transfer', 'other']).nullable()
      table.timestamp('paid_at', { useTz: true }).nullable()
      table.timestamp('confirmed_at', { useTz: true }).nullable()
      table.integer('confirmed_by').unsigned().references('id').inTable('users').nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()
      table.timestamp('cancelled_at', { useTz: true }).nullable()
      table.integer('cancelled_by').unsigned().references('id').inTable('users').nullable()
      table.text('cancel_reason').nullable()
      table.text('refund_reason').nullable()
      table.timestamp('refunded_at', { useTz: true }).nullable()
      table.integer('refunded_by').unsigned().references('id').inTable('users').nullable()
      table.text('remark').nullable()
      table.enum('source', ['online', 'offline', 'partner']).defaultTo('online')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
