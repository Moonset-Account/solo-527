import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'knowledge_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.string('title', 500).notNullable()
      table.text('content').notNullable()
      table.jsonb('tags').notNullable().defaultTo('[]')
      table.string('category', 100).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.specificType('embedding', 'vector(1536)').nullable()
      table.bigInteger('created_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.bigInteger('updated_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()

      table.index('category')
      table.index('is_active')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
