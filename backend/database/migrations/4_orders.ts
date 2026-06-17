import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('order_no', 32).notNullable().unique()
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('technician_id').unsigned().nullable().references('id').inTable('technicians').onDelete('SET NULL')
      table.integer('community_id').unsigned().nullable().references('id').inTable('communities').onDelete('SET NULL')
      table.string('device_type', 50).notNullable()
      table.text('fault_description').nullable()
      table.json('fault_photos').nullable().defaultTo('[]')
      table.string('address', 255).notNullable()
      table.string('contact_name', 50).notNullable()
      table.string('contact_phone', 20).notNullable()
      table.timestamp('appointment_time', { useTz: true }).notNullable()
      table.enum('status', ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']).notNullable().defaultTo('pending')
      table.decimal('price', 10, 2).nullable()
      table.text('remark').nullable()
      table.string('channel', 50).nullable().comment('订单来源渠道，如：社区运营、线上推广、老客户推荐等')
      table.boolean('is_demo').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index('order_no')
      table.index('user_id')
      table.index('technician_id')
      table.index('community_id')
      table.index('status')
      table.index('appointment_time')
      table.index('channel')
      table.index(['technician_id', 'appointment_time'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
