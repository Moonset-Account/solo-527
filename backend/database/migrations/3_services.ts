import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Services extends BaseSchema {
  protected tableName = 'services'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 100).notNullable()
      table.string('code', 50).notNullable().unique()
      table.text('description').nullable()
      table.integer('duration_minutes').notNullable().defaultTo(30)
      table.decimal('price', 10, 2).notNullable().defaultTo(0)
      table.integer('capacity').notNullable().defaultTo(1)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
