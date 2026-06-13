import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('tokenable_id').notNullable().unsigned()
      table.string('tokenable_type', 255).notNullable()
      table.string('name').nullable()
      table.string('type').notNullable()
      table.string('hash').notNullable().unique()
      table.text('abilities').nullable()
      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['tokenable_id', 'tokenable_type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
