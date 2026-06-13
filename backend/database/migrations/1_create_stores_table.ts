import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stores'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 100).notNullable()
      table.string('code', 50).notNullable().unique()
      table.string('address', 255).nullable()
      table.string('phone', 20).nullable()
      table.string('manager_name', 50).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.decimal('daily_target', 12, 2).nullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
