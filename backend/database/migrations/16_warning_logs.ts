import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'warning_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('warning_type', 50).notNullable()
      table.string('level', 20).defaultTo('warning')
      table.string('title', 255).notNullable()
      table.text('content')
      table.integer('related_id').unsigned()
      table.string('related_type', 50)
      table.string('status', 20).defaultTo('pending')
      table.integer('handled_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('handled_at', { useTz: true })
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
