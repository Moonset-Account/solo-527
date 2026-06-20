import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'tour_versions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('tour_id').unsigned().references('id').inTable('tours').notNullable()
      table.string('version', 20).notNullable()
      table.string('title', 200).notNullable()
      table.text('content').nullable()
      table.text('change_log').nullable()
      table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending')
      table.integer('approved_by').unsigned().references('id').inTable('users').nullable()
      table.timestamp('approved_at', { useTz: true }).nullable()
      table.integer('created_by').unsigned().references('id').inTable('users').nullable()
      table.unique(['tour_id', 'version'])
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
