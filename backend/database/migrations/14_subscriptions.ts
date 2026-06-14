import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('plan_id').unsigned().references('id').inTable('subscription_plans').onDelete('SET NULL')
      table.string('status', 20).defaultTo('active')
      table.string('billing_cycle', 20).defaultTo('monthly')
      table.decimal('amount', 14, 2).notNullable()
      table.timestamp('start_date', { useTz: true }).notNullable()
      table.timestamp('end_date', { useTz: true })
      table.timestamp('next_billing_date', { useTz: true })
      table.timestamp('cancelled_at', { useTz: true })
      table.string('cancel_reason', 255)
      table.boolean('auto_renew').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
