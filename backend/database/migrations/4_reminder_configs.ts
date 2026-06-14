import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'reminder_configs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('reminder_type', 50).notNullable().unique()
      table.string('label', 255).notNullable()
      table.integer('frequency_minutes').defaultTo(60)
      table.boolean('is_enabled').defaultTo(true)
      table.boolean('send_email').defaultTo(false)
      table.boolean('send_sms').defaultTo(false)
      table.boolean('send_in_app').defaultTo(true)
      table.text('custom_message')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
