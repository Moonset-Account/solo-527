import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permission_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('requested_role').notNullable()
      table.text('reason').nullable()
      table.enum('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending')
      table.uuid('reviewer_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.text('review_comment').nullable()
      table.timestamp('reviewed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
