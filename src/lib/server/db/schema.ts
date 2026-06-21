import { pgTable, pgEnum, uuid, date, decimal, varchar, text, timestamp, boolean, jsonb, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const severityEnum = pgEnum('severity', ['low', 'medium', 'high', 'critical']);
export const anomalyStatusEnum = pgEnum('anomaly_status', ['open', 'investigating', 'resolved', 'ignored']);
export const summaryStatusEnum = pgEnum('summary_status', ['draft', 'published']);
export const pushChannelEnum = pgEnum('push_channel', ['email', 'wework', 'dingtalk']);
export const pushStatusEnum = pgEnum('push_status', ['pending', 'sent', 'failed']);
export const exportTypeEnum = pgEnum('export_type', ['metrics', 'anomalies', 'summary']);
export const exportFormatEnum = pgEnum('export_format', ['csv', 'excel']);
export const exportStatusEnum = pgEnum('export_status', ['pending', 'processing', 'completed', 'failed']);
export const errorTypeEnum = pgEnum('error_type', ['api', 'system', 'push']);
export const errorSeverityEnum = pgEnum('error_severity', ['warning', 'error', 'critical']);

export const metricDefinitions = pgTable('metric_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull().default(''),
  formula: text('formula'),
  dataSource: varchar('data_source', { length: 100 }),
  updateFrequency: varchar('update_frequency', { length: 50 }).default('daily'),
  description: text('description'),
  owner: varchar('owner', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const metricData = pgTable('metric_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull(),
  metricKey: varchar('metric_key', { length: 100 }).notNull(),
  value: decimal('value', { precision: 18, scale: 4 }).notNull(),
  prevValue: decimal('prev_value', { precision: 18, scale: 4 }),
  wow: decimal('wow', { precision: 10, scale: 4 }),
  dod: decimal('dod', { precision: 10, scale: 4 }),
  channel: varchar('channel', { length: 50 }),
  source: varchar('source', { length: 100 }).default('manual'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    dateMetricIdx: uniqueIndex('date_metric_idx').on(table.date, table.metricKey),
    metricDateIdx: index('metric_date_idx').on(table.metricKey, table.date),
    channelIdx: index('channel_idx').on(table.channel)
  };
});

export const anomalies = pgTable('anomalies', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull(),
  metricKey: varchar('metric_key', { length: 100 }).notNull(),
  metricName: varchar('metric_name', { length: 100 }).notNull(),
  value: decimal('value', { precision: 18, scale: 4 }).notNull(),
  expectedValue: decimal('expected_value', { precision: 18, scale: 4 }).notNull(),
  deviation: decimal('deviation', { precision: 18, scale: 4 }).notNull(),
  deviationPercent: decimal('deviation_percent', { precision: 10, scale: 4 }).notNull(),
  severity: severityEnum('severity').notNull().default('medium'),
  status: anomalyStatusEnum('status').notNull().default('open'),
  channel: varchar('channel', { length: 50 }),
  description: text('description'),
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: varchar('resolved_by', { length: 50 })
});

export const anomalyNotes = pgTable('anomaly_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  anomalyId: uuid('anomaly_id').notNull().references(() => anomalies.id),
  content: text('content').notNull(),
  author: varchar('author', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const dailySummary = pgTable('daily_summary', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').unique().notNull(),
  content: text('content').notNull(),
  highlights: jsonb('highlights').$type<string[]>(),
  lows: jsonb('lows').$type<string[]>(),
  generatedBy: varchar('generated_by', { length: 50 }),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  status: summaryStatusEnum('status').notNull().default('draft')
});

export const pushRecords = pgTable('push_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  summaryId: uuid('summary_id').references(() => dailySummary.id),
  channel: pushChannelEnum('channel').notNull(),
  recipients: jsonb('recipients').$type<string[]>().notNull(),
  status: pushStatusEnum('status').notNull().default('pending'),
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const exportTasks = pgTable('export_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: exportTypeEnum('type').notNull(),
  format: exportFormatEnum('format').notNull(),
  status: exportStatusEnum('status').notNull().default('pending'),
  params: jsonb('params').$type<Record<string, any>>(),
  fileUrl: varchar('file_url', { length: 500 }),
  createdBy: varchar('created_by', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at')
});

export const operationLogs = pgTable('operation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: varchar('action', { length: 50 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: varchar('resource_id', { length: 100 }).notNull(),
  beforeData: jsonb('before_data'),
  afterData: jsonb('after_data'),
  operator: varchar('operator', { length: 50 }).notNull(),
  ip: varchar('ip', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const errorLogs = pgTable('error_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: errorTypeEnum('type').notNull(),
  endpoint: varchar('endpoint', { length: 255 }),
  method: varchar('method', { length: 20 }),
  statusCode: integer('status_code'),
  errorMessage: text('error_message').notNull(),
  stackTrace: text('stack_trace'),
  severity: errorSeverityEnum('severity').notNull().default('error'),
  alertSent: boolean('alert_sent').default(false).notNull(),
  alertSentAt: timestamp('alert_sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
