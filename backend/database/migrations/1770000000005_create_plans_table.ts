import { BaseSchema } from '@adonisjs/lucid/schema'
import app from '@adonisjs/core/services/app'

export default class extends BaseSchema {
  protected tableName = 'plans'

  async up() {
    const isSqlite = app.container.use('Adonis/Core/Config').get('database.connection') === 'sqlite'
    const jsonType = isSqlite ? 'text' : 'jsonb'

    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').primary()
      table.string('name').notNullable()
      table.string('code').unique().notNullable()
      table.text('description').nullable()
      table.decimal('price_monthly', 10, 2).notNullable()
      table.decimal('price_yearly', 10, 2).notNullable()
      table.integer('api_calls_limit').notNullable()
      table.integer('seat_limit').notNullable()
      table.specificType('features', jsonType).nullable()
      table.string('status').notNullable().defaultTo('active')
      table.integer('sort_order').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
