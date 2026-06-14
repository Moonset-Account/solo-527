import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'order_nodes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE')
      table.string('node_type', 50).notNullable()
      table.string('name', 255).notNullable()
      table.string('status', 20).defaultTo('pending')
      table.text('description')
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('scheduled_at', { useTz: true })
      table.timestamp('completed_at', { useTz: true })
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
