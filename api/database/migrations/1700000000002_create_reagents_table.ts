import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reagents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('name').notNullable()
      table.string('cas_number', 50).nullable()
      table.string('category').notNullable()
      table.enum('danger_level', ['normal', 'hazardous', 'highly_hazardous']).notNullable().defaultTo('normal')
      table.string('storage_condition').nullable()
      table.string('unit', 20).notNullable()
      table.decimal('unit_price', 12, 2).notNullable().defaultTo(0)
      table.integer('total_quantity').notNullable().defaultTo(0)
      table.integer('warning_threshold').notNullable().defaultTo(0)
      table.boolean('is_controlled').notNullable().defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
