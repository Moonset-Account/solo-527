import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'equipment'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('name').notNullable()
      table.string('code', 50).notNullable().unique()
      table.enum('status', ['active', 'inactive', 'maintenance']).notNullable().defaultTo('active')
      table.uuid('owner_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.decimal('utilization_rate', 5, 2).notNullable().defaultTo(0)
      table.timestamp('last_maintenance').nullable()
      table.timestamp('next_maintenance').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
