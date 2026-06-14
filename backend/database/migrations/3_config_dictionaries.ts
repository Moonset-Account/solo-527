import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'config_dictionaries'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('dict_type', 50).notNullable()
      table.string('dict_key', 100).notNullable()
      table.string('dict_value', 255).notNullable()
      table.string('label', 255).notNullable()
      table.integer('sort_order').defaultTo(0)
      table.text('description')
      table.boolean('is_enabled').defaultTo(true)
      table.string('color', 20)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['dict_type', 'dict_key'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
