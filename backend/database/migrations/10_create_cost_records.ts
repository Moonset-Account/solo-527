import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cost_records'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.bigInteger('user_id').unsigned().nullable().references('users.id').onDelete('SET NULL')
      table.bigInteger('email_draft_id').unsigned().nullable().references('email_drafts.id').onDelete('SET NULL')
      table.enum('cost_type', ['generation', 'review', 'embedding', 'other']).notNullable()
      table.bigInteger('prompt_tokens').unsigned().notNullable().defaultTo(0)
      table.bigInteger('completion_tokens').unsigned().notNullable().defaultTo(0)
      table.bigInteger('total_tokens').unsigned().notNullable().defaultTo(0)
      table.decimal('cost_usd', 12, 6).notNullable().defaultTo(0)
      table.integer('cost_cents').unsigned().notNullable().defaultTo(0)
      table.string('model_name', 100).nullable()
      table.jsonb('metadata').notNullable().defaultTo('{}')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('user_id')
      table.index('email_draft_id')
      table.index('cost_type')
      table.index('created_at')
    })
  }

  async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
