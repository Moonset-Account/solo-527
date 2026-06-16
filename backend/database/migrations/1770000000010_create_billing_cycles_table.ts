import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'billing_cycles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.string('name').notNullable()
      table.string('cycle_type').notNullable().defaultTo('monthly')
      table.integer('day_of_month').nullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.string('status').notNullable().defaultTo('active')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
