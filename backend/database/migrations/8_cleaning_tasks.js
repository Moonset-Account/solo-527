import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'cleaning_tasks'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('task_no', 50).notNullable().unique()
      table.string('title', 200).notNullable()
      table.text('description').nullable()
      table.enum('cleaning_type', ['daily', 'deep', 'emergency']).defaultTo('daily')
      table.enum('status', ['pending', 'in_progress', 'completed', 'cancelled']).defaultTo('pending')
      table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium')
      table.date('scheduled_date').notNullable()
      table.time('scheduled_time').nullable()
      table.string('location', 200).nullable()
      table.integer('assignee_id').unsigned().references('id').inTable('users').nullable()
      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('completed_at', { useTz: true }).nullable()
      table.text('remark').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
