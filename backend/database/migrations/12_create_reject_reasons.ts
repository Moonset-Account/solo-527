import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reject_reasons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').notNullable()
      table.string('code', 50).notNullable().unique()
      table.string('name', 200).notNullable()
      table.text('description').nullable()
      table.enum('category', ['content', 'compliance', 'format', 'data', 'other']).notNullable()
      table.integer('sort_order').notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index('category')
      table.index('is_active')
      table.index('sort_order')
    })

    this.schema.alterTable('email_drafts', (table) => {
      table.foreign('reject_reason_id').references('reject_reasons.id').onDelete('SET NULL')
    })

    this.schema.alterTable('review_records', (table) => {
      table.foreign('reject_reason_id').references('reject_reasons.id').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable('review_records', (table) => {
      table.dropForeign('reject_reason_id')
    })

    this.schema.alterTable('email_drafts', (table) => {
      table.dropForeign('reject_reason_id')
    })

    this.schema.dropTableIfExists(this.tableName)
  }
}
