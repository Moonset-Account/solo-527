import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reminder_rules'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 255).notNullable()
      table.string('entity_type', 50).notNullable()
      table.string('metric', 100).notNullable()
      table.string('operator', 10).notNullable()
      table.decimal('threshold', 12, 2).notNullable()
      table.string('level', 20).notNullable().defaultTo('normal')
      table.string('message_template', 500).notNullable()
      table.integer('timeout_minutes').notNullable().defaultTo(0)
      table.string('escalation_level', 20).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
