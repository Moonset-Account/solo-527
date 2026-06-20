import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'drivers'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 50).notNullable()
      table.string('phone', 20).notNullable()
      table.string('license_no', 50).nullable().unique()
      table.enum('status', ['active', 'inactive', 'on_leave']).defaultTo('active')
      table.integer('delay_count').defaultTo(0)
      table.integer('delay_minutes').defaultTo(0)
      table.text('remark').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
