import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seat_notes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.bigint('seat_id').notNullable().references('id').inTable('seats').onDelete('CASCADE')
      table.bigint('operator_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.string('type').notNullable().defaultTo('note')
      table.text('content').notNullable()
      table.string('result').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
