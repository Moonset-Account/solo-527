import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rectification_notes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('rectification_id').unsigned().notNullable().references('rectifications.id').onDelete('CASCADE')
      table.text('content').notNullable()
      table.integer('created_by').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['rectification_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
