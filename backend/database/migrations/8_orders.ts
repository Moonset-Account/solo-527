import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('order_no', 50).notNullable().unique()
      table.integer('partnership_id').unsigned().references('id').inTable('brand_partnerships').onDelete('SET NULL')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.string('type', 30).defaultTo('brand')
      table.decimal('amount', 14, 2).notNullable()
      table.string('currency', 10).defaultTo('CNY')
      table.string('payment_method', 30)
      table.string('status', 30).defaultTo('pending')
      table.string('payment_status', 20).defaultTo('unpaid')
      table.timestamp('paid_at', { useTz: true })
      table.string('transaction_id', 255)
      table.text('remark')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
