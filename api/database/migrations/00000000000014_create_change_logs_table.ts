import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'change_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('entity_type', 50).notNullable()
      table.integer('entity_id').unsigned().notNullable()
      table.string('action', 20).notNullable()
      table.string('field_name', 100).nullable()
      table.text('old_value').nullable()
      table.text('new_value').nullable()
      table.integer('changed_by').unsigned().notNullable().references('id').inTable('users')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
