import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'reminders'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('rule_id').unsigned().references('id').inTable('reminder_rules').nullable()
      table.string('type', 50).nullable()
      table.enum('level', ['normal', 'imminent', 'urgent']).defaultTo('normal')
      table.string('title', 200).notNullable()
      table.text('content').notNullable()
      table.integer('related_id').nullable()
      table.string('related_type', 50).nullable()
      table.json('recipient_ids').defaultTo(JSON.stringify([]))
      table.json('read_by').defaultTo(JSON.stringify([]))
      table.enum('status', ['unread', 'read', 'dismissed']).defaultTo('unread')
      table.timestamp('triggered_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
