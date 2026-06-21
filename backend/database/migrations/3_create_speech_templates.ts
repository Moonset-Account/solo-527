import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'speech_templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.string('name', 200).notNullable()
      table.text('description').nullable()
      table.string('category', 100).nullable()
      table.bigInteger('current_version_id').unsigned().nullable()
      table.bigInteger('created_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.bigInteger('updated_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()

      table.index('category')
      table.index('name')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
