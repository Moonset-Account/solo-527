import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'materials'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('material_code', 50).notNullable().unique()
      table.string('material_name', 200).notNullable()
      table.string('specification', 200).nullable()
      table.string('unit', 20).nullable()
      table.integer('stock_quantity').notNullable().defaultTo(0)
      table.integer('safety_stock').notNullable().defaultTo(0)
      table.string('supplier', 200).nullable()
      table.decimal('unit_price', 12, 2).nullable()
      table.text('remarks').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.index('material_code')
      table.index('material_name')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
