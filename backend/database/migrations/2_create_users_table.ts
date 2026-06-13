import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('username', 50).notNullable().unique()
      table.string('email', 255).notNullable().unique()
      table.string('password', 180).notNullable()
      table.string('full_name', 100).notNullable()
      table.string('phone', 20).nullable()
      table.enum('role', ['admin', 'store_manager', 'staff']).notNullable().defaultTo('store_manager')
      table.integer('store_id').unsigned().nullable().references('stores.id').onDelete('SET NULL')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
