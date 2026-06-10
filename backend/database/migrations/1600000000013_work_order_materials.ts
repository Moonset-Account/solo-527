import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'work_order_materials'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('work_order_id').unsigned().notNullable().references('id').inTable('work_orders').onDelete('CASCADE')
      table.integer('material_id').unsigned().notNullable().references('id').inTable('materials').onDelete('CASCADE')
      table.integer('required_quantity').notNullable().defaultTo(0)
      table.integer('allocated_quantity').notNullable().defaultTo(0)
      table.integer('used_quantity').notNullable().defaultTo(0)
      table.boolean('is_ready').notNullable().defaultTo(false)
      table.text('remarks').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.unique(['work_order_id', 'material_id'])
      table.index('is_ready')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
