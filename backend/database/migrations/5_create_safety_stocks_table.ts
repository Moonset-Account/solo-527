import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'safety_stocks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('store_id').unsigned().notNullable().references('stores.id').onDelete('CASCADE')
      table.integer('ingredient_id').unsigned().notNullable().references('ingredients.id').onDelete('CASCADE')
      table.decimal('min_quantity', 12, 2).notNullable().defaultTo(0)
      table.decimal('max_quantity', 12, 2).notNullable().defaultTo(0)
      table.decimal('warning_quantity', 12, 2).notNullable().defaultTo(0)
      table.unique(['store_id', 'ingredient_id'])
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
