import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'operation_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('action', 100).notNullable()
      table.string('module', 100).notNullable()
      table.string('resource_type', 100).nullable()
      table.integer('resource_id').unsigned().nullable()
      table.text('old_value', 'longtext').nullable()
      table.text('new_value', 'longtext').nullable()
      table.string('ip_address', 45).nullable()
      table.string('user_agent', 255).nullable()
      table.boolean('is_risk_related').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true })
      table.index('user_id')
      table.index('module')
      table.index('action')
      table.index(['resource_type', 'resource_id'])
      table.index('created_at')
      table.index('is_risk_related')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
