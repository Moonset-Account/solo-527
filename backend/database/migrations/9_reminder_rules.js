import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'reminder_rules'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 200).notNullable()
      table.enum('type', ['driver_delay', 'order_status', 'inventory_warning', 'cleaning_task', 'custom']).notNullable()
      table.enum('level', ['normal', 'imminent', 'urgent']).defaultTo('normal')
      table.json('trigger_condition').nullable()
      table.json('notification_channels').defaultTo(JSON.stringify(['app']))
      table.json('recipient_roles').defaultTo(JSON.stringify(['operator']))
      table.string('template_title', 200).notNullable()
      table.text('template_content').notNullable()
      table.boolean('enabled').defaultTo(true)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
