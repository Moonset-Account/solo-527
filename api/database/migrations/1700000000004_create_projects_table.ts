import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('name').notNullable()
      table.uuid('principal_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.decimal('budget', 14, 2).notNullable().defaultTo(0)
      table.decimal('spent', 14, 2).notNullable().defaultTo(0)
      table.enum('status', ['active', 'completed', 'suspended']).notNullable().defaultTo('active')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
