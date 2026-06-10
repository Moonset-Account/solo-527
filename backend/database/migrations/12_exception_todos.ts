import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ExceptionTodos extends BaseSchema {
  protected tableName = 'exception_todos'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('type', 30).notNullable()
      table.string('title', 200).notNullable()
      table.text('description').nullable()
      table.integer('booking_id').unsigned().references('id').inTable('bookings').nullable()
      table.integer('customer_id').unsigned().references('id').inTable('customers').nullable()
      table.string('priority', 20).notNullable().defaultTo('medium')
      table.string('status', 20).notNullable().defaultTo('pending')
      table.integer('assigned_to').unsigned().references('id').inTable('users').nullable()
      table.integer('handled_by').unsigned().references('id').inTable('users').nullable()
      table.text('resolution').nullable()
      table.timestamp('handled_at', { useTz: true }).nullable()
      table.timestamp('deadline_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.index(['status', 'priority'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
