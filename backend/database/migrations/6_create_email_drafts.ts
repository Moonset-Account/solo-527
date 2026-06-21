import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_drafts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.string('subject', 500).notNullable()
      table.text('body').notNullable()
      table.string('recipient_email', 255).nullable()
      table.string('recipient_name', 200).nullable()
      table.jsonb('customer_background').notNullable().defaultTo('{}')
      table.jsonb('cited_sources').notNullable().defaultTo('[]')
      table.enum('status', ['draft', 'reviewing', 'approved', 'rejected', 'sent', 'archived']).notNullable().defaultTo('draft')
      table.enum('risk_level', ['low', 'medium', 'high', 'critical']).nullable()
      table.text('risk_notes').nullable()
      table.bigInteger('sales_id').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.bigInteger('ops_id').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.bigInteger('prompt_version_id').unsigned().nullable().references('prompt_versions.id').onDelete('SET NULL')
      table.bigInteger('speech_template_version_id').unsigned().nullable().references('speech_template_versions.id').onDelete('SET NULL')
      table.integer('generation_cost').unsigned().notNullable().defaultTo(0)
      table.integer('review_count').unsigned().notNullable().defaultTo(0)
      table.bigInteger('reject_reason_id').unsigned().nullable()
      table.text('reject_detail').nullable()
      table.timestamp('submitted_at').nullable()
      table.timestamp('approved_at').nullable()
      table.timestamp('rejected_at').nullable()
      table.timestamp('sent_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()

      table.index('status')
      table.index('risk_level')
      table.index('sales_id')
      table.index('ops_id')
      table.index('created_at')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
