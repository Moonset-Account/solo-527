import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cited_sources'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('email_draft_id').unsigned().notNullable().references('email_drafts.id').onDelete('CASCADE')
      table.bigInteger('knowledge_item_id').unsigned().nullable().references('knowledge_items.id').onDelete('SET NULL')
      table.string('source_title', 500).notNullable()
      table.text('source_content').notNullable()
      table.decimal('relevance_score', 5, 4).nullable()
      table.bigInteger('created_by').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('email_draft_id')
      table.index('knowledge_item_id')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
