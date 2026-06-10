import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class BookingNotes extends BaseSchema {
  protected tableName = 'booking_notes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('booking_id').unsigned().references('id').inTable('bookings').onDelete('CASCADE')
      table.text('content').notNullable()
      table.string('type', 20).notNullable().defaultTo('normal')
      table.integer('created_by').unsigned().references('id').inTable('users').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
