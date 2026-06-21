import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'equipment_alerts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('equipment_id').notNullable().references('id').inTable('equipment').onDelete('CASCADE')
      table.enum('alert_type', ['maintenance_due', 'calibration_expired', 'malfunction']).notNullable()
      table.text('message').notNullable()
      table.enum('status', ['pending', 'confirmed_by_admin', 'confirmed_by_owner', 'resolved']).notNullable().defaultTo('pending')
      table.boolean('confirmed_by_admin').notNullable().defaultTo(false)
      table.boolean('confirmed_by_owner').notNullable().defaultTo(false)
      table.timestamp('admin_confirmed_at').nullable()
      table.timestamp('owner_confirmed_at').nullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
