import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigint('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.bigint('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE')

      table.primary(['user_id', 'role_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
