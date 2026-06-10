import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class BookingAttachments extends BaseSchema {
  protected tableName = 'booking_attachments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('booking_id').unsigned().references('id').inTable('bookings').onDelete('CASCADE')
      table.string('file_name', 255).notNullable()
      table.string('file_path', 500).notNullable()
      table.string('file_type', 100).nullable()
      table.integer('file_size').nullable()
      table.integer('uploaded_by').unsigned().references('id').inTable('users').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
