import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'speech_template_versions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('speech_template_id').unsigned().notNullable().references('speech_templates.id').onDelete('CASCADE')
      table.string('version', 50).notNullable()
      table.text('content').notNullable()
      table.text('variables').nullable()
      table.boolean('is_current').notNullable().defaultTo(false)
      table.bigInteger('created_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['speech_template_id', 'is_current'])
    })

    this.schema.alterTable('speech_templates', (table) => {
      table.foreign('current_version_id').references('speech_template_versions.id').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable('speech_templates', (table) => {
      table.dropForeign('current_version_id')
      table.dropColumn('current_version_id')
    })
    this.schema.dropTableIfExists(this.tableName)
  }
}
