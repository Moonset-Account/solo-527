import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('username', 50).notNullable().unique()
      table.string('password_hash').notNullable()
      table.string('display_name', 100).nullable()
      table.enum('role', ['admin', 'reagent_manager', 'project_leader', 'staff']).notNullable().defaultTo('staff')
      table.enum('status', ['active', 'inactive', 'pending_review']).notNullable().defaultTo('active')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
