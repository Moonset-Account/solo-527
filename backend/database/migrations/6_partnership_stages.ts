import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'partnership_stages'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('partnership_id').unsigned().references('id').inTable('brand_partnerships').onDelete('CASCADE')
      table.string('stage', 50).notNullable()
      table.string('status', 20).defaultTo('pending')
      table.text('notes')
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('completed_at', { useTz: true })
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
