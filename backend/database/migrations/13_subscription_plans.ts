import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'subscription_plans'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('plan_code', 50).notNullable().unique()
      table.string('name', 255).notNullable()
      table.text('description')
      table.text('features')
      table.decimal('monthly_price', 14, 2).notNullable()
      table.decimal('yearly_price', 14, 2).notNullable()
      table.string('billing_cycle', 20).defaultTo('monthly')
      table.string('level', 20).defaultTo('basic')
      table.boolean('is_active').defaultTo(true)
      table.integer('sort_order').defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
