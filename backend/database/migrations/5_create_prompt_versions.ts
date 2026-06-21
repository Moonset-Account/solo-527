import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'prompt_versions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.string('name', 200).notNullable()
      table.string('prompt_type', 100).notNullable()
      table.string('version', 50).notNullable()
      table.text('system_prompt').notNullable()
      table.text('user_prompt_template').nullable()
      table.jsonb('parameters').notNullable().defaultTo('{}')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.bigInteger('created_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.bigInteger('updated_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()

      table.unique(['prompt_type', 'version'])
      table.index(['prompt_type', 'is_active'])
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
