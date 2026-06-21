import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'operation_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('operator_id').notNullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('action').notNullable()
      table.string('target_type').notNullable()
      table.string('target_name').nullable()
      table.text('detail').nullable()
      table.text('handover_note').nullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
