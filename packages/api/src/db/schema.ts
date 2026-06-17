import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const id = () =>
  uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`);

const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable('users', {
  id: id(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 20 }).notNull().default('viewer'),
  ...timestamps,
});

export const zones = pgTable('zones', {
  id: id(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  capacity: numeric('capacity', { precision: 12, scale: 2 }).notNull().default('0'),
  ...timestamps,
});

export const meters = pgTable(
  'meters',
  {
    id: id(),
    zoneId: uuid('zone_id').notNull().references(() => zones.id),
    name: varchar('name', { length: 200 }).notNull(),
    model: varchar('model', { length: 100 }),
    serialNumber: varchar('serial_number', { length: 100 }).unique(),
    status: varchar('status', { length: 20 }).notNull().default('online'),
    lastHeartbeat: timestamp('last_heartbeat'),
    installedAt: timestamp('installed_at').notNull(),
    ...timestamps,
  },
  (table) => ({
    zoneIdx: index('meters_zone_idx').on(table.zoneId),
    statusIdx: index('meters_status_idx').on(table.status),
  })
);

export const devices = pgTable(
  'devices',
  {
    id: id(),
    zoneId: uuid('zone_id').notNull().references(() => zones.id),
    meterId: uuid('meter_id').references(() => meters.id),
    name: varchar('name', { length: 200 }).notNull(),
    type: varchar('type', { length: 30 }).notNull(),
    model: varchar('model', { length: 100 }),
    serialNumber: varchar('serial_number', { length: 100 }).unique(),
    status: varchar('status', { length: 20 }).notNull().default('running'),
    capacity: numeric('capacity', { precision: 12, scale: 2 }).notNull().default('0'),
    installedAt: timestamp('installed_at').notNull(),
    ...timestamps,
  },
  (table) => ({
    zoneIdx: index('devices_zone_idx').on(table.zoneId),
    meterIdx: index('devices_meter_idx').on(table.meterId),
    typeIdx: index('devices_type_idx').on(table.type),
  })
);

export const alerts = pgTable(
  'alerts',
  {
    id: id(),
    deviceId: uuid('device_id').notNull().references(() => devices.id),
    zoneId: uuid('zone_id').notNull().references(() => zones.id),
    level: varchar('level', { length: 20 }).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    acknowledgedBy: uuid('acknowledged_by').references(() => users.id),
    acknowledgedAt: timestamp('acknowledged_at'),
    resolvedBy: uuid('resolved_by').references(() => users.id),
    resolvedAt: timestamp('resolved_at'),
    assignee: varchar('assignee', { length: 100 }),
    sourceData: jsonb('source_data'),
    ...timestamps,
  },
  (table) => ({
    deviceIdx: index('alerts_device_idx').on(table.deviceId),
    zoneIdx: index('alerts_zone_idx').on(table.zoneId),
    statusIdx: index('alerts_status_idx').on(table.status),
    levelIdx: index('alerts_level_idx').on(table.level),
    createdAtIdx: index('alerts_created_at_idx').on(table.createdAt),
  })
);

export const alertActivities = pgTable(
  'alert_activities',
  {
    id: id(),
    alertId: uuid('alert_id').notNull().references(() => alerts.id, { onDelete: 'cascade' }),
    operatorId: uuid('operator_id').notNull().references(() => users.id),
    operatorName: varchar('operator_name', { length: 100 }).notNull(),
    action: varchar('action', { length: 30 }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    alertIdx: index('alert_activities_alert_idx').on(table.alertId),
  })
);

export const energyRecords = pgTable(
  'energy_records',
  {
    id: id(),
    meterId: uuid('meter_id').notNull().references(() => meters.id),
    zoneId: uuid('zone_id').notNull().references(() => zones.id),
    timestamp: timestamp('timestamp').notNull(),
    production: numeric('production', { precision: 14, scale: 4 }).notNull().default('0'),
    consumption: numeric('consumption', { precision: 14, scale: 4 }).notNull().default('0'),
    gridExport: numeric('grid_export', { precision: 14, scale: 4 }).notNull().default('0'),
    gridImport: numeric('grid_import', { precision: 14, scale: 4 }).notNull().default('0'),
    efficiency: numeric('efficiency', { precision: 5, scale: 2 }).notNull().default('0'),
  },
  (table) => ({
    meterIdx: index('energy_records_meter_idx').on(table.meterId),
    zoneIdx: index('energy_records_zone_idx').on(table.zoneId),
    timestampIdx: index('energy_records_timestamp_idx').on(table.timestamp),
  })
);

export const subsidyRecords = pgTable(
  'subsidy_records',
  {
    id: id(),
    zoneId: uuid('zone_id').notNull().references(() => zones.id),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    productionKwh: numeric('production_kwh', { precision: 14, scale: 4 }).notNull().default('0'),
    subsidyRate: numeric('subsidy_rate', { precision: 10, scale: 4 }).notNull().default('0'),
    subsidyAmount: numeric('subsidy_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),
    remark: text('remark'),
    updatedBy: uuid('updated_by').references(() => users.id),
    ...timestamps,
  },
  (table) => ({
    zoneIdx: index('subsidy_records_zone_idx').on(table.zoneId),
    periodIdx: index('subsidy_records_period_idx').on(table.periodStart, table.periodEnd),
  })
);

export const energySavingTargets = pgTable(
  'energy_saving_targets',
  {
    id: id(),
    zoneId: uuid('zone_id').references(() => zones.id),
    name: varchar('name', { length: 200 }).notNull(),
    period: varchar('period', { length: 20 }).notNull(),
    targetKwh: numeric('target_kwh', { precision: 14, scale: 4 }).notNull().default('0'),
    baselineKwh: numeric('baseline_kwh', { precision: 14, scale: 4 }).notNull().default('0'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    ...timestamps,
  },
  (table) => ({
    zoneIdx: index('energy_saving_targets_zone_idx').on(table.zoneId),
  })
);

export const energySavingDetails = pgTable(
  'energy_saving_details',
  {
    id: id(),
    targetId: uuid('target_id')
      .notNull()
      .references(() => energySavingTargets.id, { onDelete: 'cascade' }),
    date: timestamp('date').notNull(),
    actualKwh: numeric('actual_kwh', { precision: 14, scale: 4 }).notNull().default('0'),
    baselineKwh: numeric('baseline_kwh', { precision: 14, scale: 4 }).notNull().default('0'),
    savedKwh: numeric('saved_kwh', { precision: 14, scale: 4 }).notNull().default('0'),
    zoneId: uuid('zone_id').references(() => zones.id),
    deviceId: uuid('device_id').references(() => devices.id),
  },
  (table) => ({
    targetIdx: index('energy_saving_details_target_idx').on(table.targetId),
    dateIdx: index('energy_saving_details_date_idx').on(table.date),
  })
);

export const meterOfflineRecords = pgTable(
  'meter_offline_records',
  {
    id: id(),
    meterId: uuid('meter_id').notNull().references(() => meters.id),
    zoneId: uuid('zone_id').notNull().references(() => zones.id),
    offlineAt: timestamp('offline_at').notNull(),
    onlineAt: timestamp('online_at'),
    durationMinutes: integer('duration_minutes'),
    reason: text('reason').notNull(),
    reasonCategory: varchar('reason_category', { length: 30 }).notNull().default('unknown'),
    assignee: varchar('assignee', { length: 100 }),
    acknowledgedAt: timestamp('acknowledged_at'),
    resolvedAt: timestamp('resolved_at'),
    responseMinutes: integer('response_minutes'),
    resolutionNote: text('resolution_note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    meterIdx: index('meter_offline_meter_idx').on(table.meterId),
    zoneIdx: index('meter_offline_zone_idx').on(table.zoneId),
    offlineAtIdx: index('meter_offline_at_idx').on(table.offlineAt),
    categoryIdx: index('meter_offline_category_idx').on(table.reasonCategory),
  })
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: id(),
    userId: uuid('user_id').notNull().references(() => users.id),
    userName: varchar('user_name', { length: 100 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id'),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    ip: varchar('ip', { length: 45 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('audit_logs_user_idx').on(table.userId),
    entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  })
);

export const savedFilters = pgTable(
  'saved_filters',
  {
    id: id(),
    name: varchar('name', { length: 200 }).notNull(),
    page: varchar('page', { length: 100 }).notNull(),
    filters: jsonb('filters').notNull().default({}),
    userId: uuid('user_id').notNull().references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userPageIdx: index('saved_filters_user_page_idx').on(table.userId, table.page),
  })
);
