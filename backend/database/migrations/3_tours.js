import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'tours'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 200).notNullable()
      table.string('code', 50).notNullable().unique()
      table.string('destination', 100).notNullable()
      table.integer('duration').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.integer('capacity').notNullable()
      table.text('description').nullable()
      table.json('highlights').nullable().defaultTo(JSON.stringify([]))
      table.string('meeting_point', 200).nullable()
      table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft')
      table.integer('operator_id').unsigned().references('id').inTable('users').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
