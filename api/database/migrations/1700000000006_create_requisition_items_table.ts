import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'requisition_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('requisition_id').notNullable().references('id').inTable('requisitions').onDelete('CASCADE')
      table.uuid('reagent_id').notNullable().references('id').inTable('reagents').onDelete('RESTRICT')
      table.integer('quantity').notNullable()
      table.decimal('unit_price', 12, 2).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
