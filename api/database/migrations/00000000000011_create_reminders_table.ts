import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reminders'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('rule_id').unsigned().notNullable().references('id').inTable('reminder_rules')
      table.string('entity_type', 50).notNullable()
      table.integer('entity_id').unsigned().notNullable()
      table.string('level', 20).notNullable().defaultTo('normal')
      table.string('title', 255).notNullable()
      table.text('message').notNullable()
      table.boolean('is_read').notNullable().defaultTo(false)
      table.boolean('is_resolved').notNullable().defaultTo(false)
      table.integer('assigned_to').unsigned().nullable().references('id').inTable('users')
      table.timestamp('escalated_at', { useTz: true }).nullable()
      table.timestamp('resolved_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
