import knex from 'knex';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const dbDir = path.dirname(config.database.filename);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: config.database.filename
  },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn: any, done: any) => {
      conn.pragma('foreign_keys = ON');
      done();
    }
  }
});

export async function initDatabase() {
  const hasUsersTable = await db.schema.hasTable('users');
  
  if (!hasUsersTable) {
    await createTables();
    console.log('数据库表创建完成');
  }
}

async function createTables() {
  await db.schema.createTable('users', (table) => {
    table.string('id', 36).primary();
    table.string('username', 50).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['member', 'operator', 'admin']).notNullable();
    table.string('name', 100).notNullable();
    table.string('phone', 20);
    table.integer('points').defaultTo(100);
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('equipment', (table) => {
    table.string('id', 36).primary();
    table.string('name', 100).notNullable();
    table.enum('type', ['tractor', 'transplanter', 'drone', 'other']).notNullable();
    table.string('model', 100);
    table.string('serial_number', 100).unique();
    table.date('purchase_date');
    table.decimal('purchase_price', 12, 2);
    table.enum('status', ['available', 'in_use', 'maintenance', 'broken']).defaultTo('available');
    table.integer('total_hours').defaultTo(0);
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('fields', (table) => {
    table.string('id', 36).primary();
    table.string('name', 100).notNullable();
    table.decimal('area', 10, 2).notNullable();
    table.string('location', 255);
    table.json('polygon_coords');
    table.string('soil_type', 50);
    table.string('owner_id', 36).references('id').inTable('users');
    table.datetime('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('reservations', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users');
    table.string('equipment_id', 36).notNullable().references('id').inTable('equipment');
    table.string('field_id', 36).notNullable().references('id').inTable('fields');
    table.string('crop_type', 50);
    table.datetime('start_time').notNullable();
    table.datetime('end_time').notNullable();
    table.enum('status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'queued']).defaultTo('pending');
    table.enum('price_type', ['self_use', 'cooperative_subsidy', 'cross_village']).notNullable();
    table.decimal('estimated_price', 12, 2);
    table.boolean('is_cancelled').defaultTo(false);
    table.text('cancel_reason');
    table.boolean('is_rain_cancel').defaultTo(false);
    table.integer('queue_position');
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('work_orders', (table) => {
    table.string('id', 36).primary();
    table.string('reservation_id', 36).notNullable().references('id').inTable('reservations');
    table.string('operator_id', 36).notNullable().references('id').inTable('users');
    table.json('route_info');
    table.enum('status', ['assigned', 'accepted', 'in_progress', 'completed']).defaultTo('assigned');
    table.datetime('assigned_at').defaultTo(db.fn.now());
    table.datetime('completed_at');
  });

  await db.schema.createTable('work_records', (table) => {
    table.string('id', 36).primary();
    table.string('reservation_id', 36).notNullable().references('id').inTable('reservations');
    table.string('equipment_id', 36).notNullable().references('id').inTable('equipment');
    table.string('field_id', 36).notNullable().references('id').inTable('fields');
    table.string('operator_id', 36).notNullable().references('id').inTable('users');
    table.decimal('fuel_consumption', 8, 2);
    table.decimal('work_hours', 4, 1);
    table.json('photos');
    table.text('notes');
    table.datetime('completed_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('maintenance_tickets', (table) => {
    table.string('id', 36).primary();
    table.string('equipment_id', 36).notNullable().references('id').inTable('equipment');
    table.string('reported_by', 36).notNullable().references('id').inTable('users');
    table.string('title', 200).notNullable();
    table.text('description');
    table.enum('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open');
    table.decimal('cost', 12, 2).defaultTo(0);
    table.datetime('reported_at').defaultTo(db.fn.now());
    table.datetime('resolved_at');
  });

  await db.schema.createTable('settlements', (table) => {
    table.string('id', 36).primary();
    table.string('reservation_id', 36).notNullable().references('id').inTable('reservations');
    table.string('user_id', 36).notNullable().references('id').inTable('users');
    table.enum('price_type', ['self_use', 'cooperative_subsidy', 'cross_village']).notNullable();
    table.decimal('base_price', 12, 2).notNullable();
    table.decimal('subsidy_amount', 12, 2).defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable();
    table.integer('points_deducted').defaultTo(0);
    table.enum('status', ['pending', 'confirmed', 'paid']).defaultTo('pending');
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('confirmed_at');
  });

  await db.schema.createTable('audit_logs', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).references('id').inTable('users');
    table.string('action', 100).notNullable();
    table.string('resource_type', 50).notNullable();
    table.string('resource_id', 36);
    table.json('before_data');
    table.json('after_data');
    table.string('ip_address', 50);
    table.datetime('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('reservation_queue', (table) => {
    table.string('id', 36).primary();
    table.string('reservation_id', 36).notNullable().references('id').inTable('reservations');
    table.integer('priority').defaultTo(0);
    table.enum('status', ['waiting', 'promoted', 'cancelled']).defaultTo('waiting');
    table.datetime('queued_at').defaultTo(db.fn.now());
  });
}
