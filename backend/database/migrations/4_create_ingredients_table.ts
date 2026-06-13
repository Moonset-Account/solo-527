import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ingredients'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 100).notNullable()
      table.string('code', 50).notNullable().unique()
      table.string('category', 50).nullable()
      table.string('unit', 20).notNullable()
      table.decimal('unit_price', 12, 2).notNullable().defaultTo(0)
      table.string('specification', 100).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.text('remark').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
