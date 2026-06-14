import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'sponsorship_benefits'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('partnership_id').unsigned().references('id').inTable('brand_partnerships').onDelete('CASCADE')
      table.string('benefit_type', 50).notNullable()
      table.string('name', 255).notNullable()
      table.text('description')
      table.integer('quantity').defaultTo(1)
      table.decimal('unit_price', 14, 2)
      table.decimal('total_amount', 14, 2)
      table.string('status', 20).defaultTo('draft')
      table.string('delivery_status', 20).defaultTo('pending')
      table.date('expected_delivery_date')
      table.date('actual_delivery_date')
      table.integer('revision_round').defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
