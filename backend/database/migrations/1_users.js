import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('username', 50).notNullable().unique()
      table.string('password', 255).notNullable()
      table.string('name', 50).notNullable()
      table.enum('role', ['admin', 'operator', 'viewer']).defaultTo('operator')
      table.string('phone', 20).nullable()
      table.string('email', 100).nullable()
      table.enum('status', ['active', 'inactive']).defaultTo('active')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
