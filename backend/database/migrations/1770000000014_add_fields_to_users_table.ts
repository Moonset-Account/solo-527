import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('phone').nullable()
      table.string('department').nullable()
      table.string('status').notNullable().defaultTo('active')
      table.timestamp('last_login_at').nullable()
      table.string('last_login_ip').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('phone')
      table.dropColumn('department')
      table.dropColumn('status')
      table.dropColumn('last_login_at')
      table.dropColumn('last_login_ip')
    })
  }
}
