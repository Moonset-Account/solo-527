import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'requisitions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('applicant_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE')
      table.enum('status', ['pending', 'approved', 'rejected', 'completed']).notNullable().defaultTo('pending')
      table.text('purpose').notNullable()
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
