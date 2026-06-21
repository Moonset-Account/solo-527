import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'review_records'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('email_draft_id').unsigned().notNullable().references('email_drafts.id').onDelete('CASCADE')
      table.bigInteger('reviewer_id').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.enum('action', ['approved', 'rejected', 'requested_changes']).notNullable()
      table.text('comments').nullable()
      table.jsonb('edits_made').notNullable().defaultTo('{}')
      table.bigInteger('reject_reason_id').unsigned().nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('email_draft_id')
      table.index('reviewer_id')
      table.index('action')
      table.index('created_at')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
