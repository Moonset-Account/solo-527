import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'appointment_items'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('appointment_id').unsigned().notNullable().references('id').inTable('appointments').onDelete('CASCADE')
      table.integer('service_id').unsigned().notNullable().references('id').inTable('services')
      table.decimal('price', 12, 2).notNullable()
      table.string('status', 20).notNullable().defaultTo('pending')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
