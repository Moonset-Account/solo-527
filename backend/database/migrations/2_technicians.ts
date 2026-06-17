import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'technicians'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('name', 50).notNullable()
      table.string('phone', 20).notNullable().unique()
      table.json('skills').notNullable().defaultTo('[]')
      table.enum('status', ['active', 'inactive', 'on_leave']).notNullable().defaultTo('active')
      table.integer('daily_limit').notNullable().defaultTo(5)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
