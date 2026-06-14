import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'order_attachments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE')
      table.integer('benefit_id').unsigned().references('id').inTable('sponsorship_benefits').onDelete('CASCADE').nullable()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('file_name', 255).notNullable()
      table.string('file_path', 500).notNullable()
      table.string('file_size', 20)
      table.string('mime_type', 100)
      table.integer('revision_round').defaultTo(0)
      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
