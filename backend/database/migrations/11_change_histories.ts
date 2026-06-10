import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ChangeHistories extends BaseSchema {
  protected tableName = 'change_histories'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('booking_id').unsigned().references('id').inTable('bookings').onDelete('CASCADE')
      table.string('field_name', 50).notNullable()
      table.text('old_value').nullable()
      table.text('new_value').nullable()
      table.integer('changed_by').unsigned().references('id').inTable('users').nullable()
      table.string('change_reason', 200).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
