import knex from 'knex';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const uploadsDir = path.join(process.cwd(), config.upload.dir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const db = knex({
  client: 'mysql2',
  connection: {
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    multipleStatements: true
  },
  pool: {
    min: 2,
    max: 10
  },
  useNullAsDefault: true
});

export async function initDatabase() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ 数据库连接成功');
  } catch (err) {
    console.error('❌ 数据库连接失败:', err);
    console.log('请确保 MariaDB 已启动并创建了数据库:', config.database.database);
    throw err;
  }

  const hasUsersTable = await db.schema.hasTable('users');
  
  if (!hasUsersTable) {
    await createTables();
    console.log('✅ 数据库表创建完成');
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
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
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
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('fields', (table) => {
    table.string('id', 36).primary();
    table.string('name', 100).notNullable();
    table.decimal('area', 10, 2).notNullable();
    table.string('location', 255);
    table.json('polygon_coords');
    table.string('soil_type', 50);
    table.string('owner_id', 36).references('id').inTable('users');
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('reservations', (table) => {
    table.string('id', 36).primary();
    table.string('member_id', 36).notNullable().references('id').inTable('users');
    table.string('equipment_id', 36).notNullable().references('id').inTable('equipment');
    table.string('field_id', 36).notNullable().references('id').inTable('fields');
    table.string('crop', 50);
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.enum('status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'waitlisted']).defaultTo('pending');
    table.enum('price_type', ['member', 'subsidy', 'commercial']).notNullable();
    table.decimal('estimated_price', 12, 2);
    table.text('cancel_reason');
    table.boolean('is_rain_cancel').defaultTo(false);
    table.integer('queue_position');
    table.string('original_reservation_id', 36);
    table.text('notes');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('work_orders', (table) => {
    table.string('id', 36).primary();
    table.string('reservation_id', 36).notNullable().references('id').inTable('reservations');
    table.string('operator_id', 36).notNullable().references('id').inTable('users');
    table.json('route_info');
    table.enum('status', ['assigned', 'in_progress', 'completed']).defaultTo('assigned');
    table.timestamp('assigned_at').defaultTo(db.fn.now());
    table.timestamp('started_at');
    table.timestamp('completed_at');
  });

  await db.schema.createTable('work_records', (table) => {
    table.string('id', 36).primary();
    table.string('reservation_id', 36).notNullable().references('id').inTable('reservations');
    table.string('work_order_id', 36).references('id').inTable('work_orders');
    table.string('equipment_id', 36).notNullable().references('id').inTable('equipment');
    table.string('field_id', 36).notNullable().references('id').inTable('fields');
    table.string('operator_id', 36).notNullable().references('id').inTable('users');
    table.decimal('fuel_consumption', 8, 2);
    table.decimal('work_hours', 4, 1);
    table.json('field_photos');
    table.text('notes');
    table.timestamp('completed_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('maintenance_tickets', (table) => {
    table.string('id', 36).primary();
    table.string('equipment_id', 36).notNullable().references('id').inTable('equipment');
    table.string('reported_by', 36).notNullable().references('id').inTable('users');
    table.string('title', 200).notNullable();
    table.text('description');
    table.enum('priority', ['low', 'medium', 'high', 'critical']).defaultTo('medium');
    table.enum('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open');
    table.decimal('cost', 12, 2).defaultTo(0);
    table.string('affected_reservation_ids', 500);
    table.text('resolution_notes');
    table.timestamp('reported_at').defaultTo(db.fn.now());
    table.timestamp('resolved_at');
  });

  await db.schema.createTable('settlements', (table) => {
    table.string('id', 36).primary();
    table.string('reservation_id', 36).notNullable().references('id').inTable('reservations');
    table.string('member_id', 36).notNullable().references('id').inTable('users');
    table.enum('price_type', ['member', 'subsidy', 'commercial']).notNullable();
    table.decimal('base_price', 12, 2).notNullable();
    table.decimal('price_multiplier', 4, 2).notNullable();
    table.decimal('fuel_cost', 12, 2).defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable();
    table.integer('points_deducted').defaultTo(0);
    table.enum('status', ['pending', 'confirmed', 'paid']).defaultTo('pending');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('confirmed_at');
  });

  await db.schema.createTable('audit_logs', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).references('id').inTable('users');
    table.string('user_name', 100);
    table.string('action', 100).notNullable();
    table.string('resource_type', 50).notNullable();
    table.string('resource_id', 36);
    table.text('description');
    table.json('old_values');
    table.json('new_values');
    table.string('ip_address', 50);
    table.string('user_agent', 255);
    table.timestamp('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('reservation_queue', (table) => {
    table.string('id', 36).primary();
    table.string('reservation_id', 36).notNullable().references('id').inTable('reservations');
    table.string('equipment_id', 36).notNullable().references('id').inTable('equipment');
    table.timestamp('target_start_time').notNullable();
    table.timestamp('target_end_time').notNullable();
    table.integer('priority').defaultTo(0);
    table.enum('status', ['waiting', 'promoted', 'cancelled']).defaultTo('waiting');
    table.timestamp('queued_at').defaultTo(db.fn.now());
    table.timestamp('promoted_at');
  });
}
