import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reagent_batches'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('reagent_id').notNullable().references('id').inTable('reagents').onDelete('CASCADE')
      table.string('batch_number').notNullable()
      table.string('supplier').notNullable()
      table.date('production_date').nullable()
      table.date('expiry_date').nullable()
      table.string('storage_location').nullable()
      table.integer('quantity').notNullable().defaultTo(0)
      table.decimal('unit_price', 12, 2).notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
