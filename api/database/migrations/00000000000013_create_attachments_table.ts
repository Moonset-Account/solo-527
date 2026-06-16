import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attachments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('attachable_type', 50).notNullable()
      table.integer('attachable_id').unsigned().notNullable()
      table.string('file_name', 255).notNullable()
      table.string('file_type', 50).notNullable()
      table.bigint('file_size').notNullable()
      table.string('disk', 50).notNullable().defaultTo('local')
      table.string('path', 500).notNullable()
      table.integer('uploaded_by').unsigned().notNullable().references('id').inTable('users')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
