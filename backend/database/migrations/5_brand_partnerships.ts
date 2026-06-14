import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'brand_partnerships'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('code', 50).notNullable().unique()
      table.string('brand_name', 255).notNullable()
      table.string('brand_industry', 100)
      table.string('contact_name', 50)
      table.string('contact_phone', 20)
      table.string('contact_email', 255)
      table.decimal('contract_amount', 14, 2)
      table.string('current_stage', 50).defaultTo('lead')
      table.string('priority', 20).defaultTo('normal')
      table.string('status', 20).defaultTo('active')
      table.integer('responsible_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.date('expected_sign_date')
      table.date('actual_sign_date')
      table.text('description')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
