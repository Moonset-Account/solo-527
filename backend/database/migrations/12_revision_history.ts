import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'revision_history'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('entity_type', 50).notNullable()
      table.integer('entity_id').unsigned().notNullable()
      table.integer('revision_round').notNullable().defaultTo(1)
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.json('before_data')
      table.json('after_data')
      table.text('change_description')
      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
