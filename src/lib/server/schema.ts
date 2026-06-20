import { pgTable, uuid, varchar, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['researcher', 'admin']);
export const statusEnum = pgEnum('status', ['pending', 'approved', 'rejected', 'completed', 'processing', 'resolved', 'failed']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'critical']);
export const todoTypeEnum = pgEnum('todo_type', ['project_report', 'instrument_booking', 'sample_tracking']);
export const complianceTypeEnum = pgEnum('compliance_type', ['requisition', 'experiment', 'todo', 'risk']);
export const hazardLevelEnum = pgEnum('hazard_level', ['low', 'medium', 'high', 'critical']);
export const reagentCategoryEnum = pgEnum('reagent_category', ['normal', 'hazardous', 'controlled']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: userRoleEnum('role').default('researcher')
});

export const reagents = pgTable('reagents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  casNumber: varchar('cas_number', { length: 50 }),
  category: reagentCategoryEnum('category').default('normal'),
  stock: integer('stock').notNull().default(0),
  unit: varchar('unit', { length: 20 }).notNull(),
  hazardLevel: hazardLevelEnum('hazard_level')
});

export const requisitions = pgTable('requisitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  reagentId: uuid('reagent_id').references(() => reagents.id),
  userId: uuid('user_id').references(() => users.id),
  userName: varchar('user_name', { length: 100 }).notNull(),
  quantity: integer('quantity').notNull(),
  purpose: text('purpose').notNull(),
  status: statusEnum('status').default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  complianceRecordId: uuid('compliance_record_id').references(() => complianceRecords.id)
});

export const complianceRecords = pgTable('compliance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: complianceTypeEnum('type').notNull(),
  referenceId: varchar('reference_id', { length: 100 }).notNull(),
  status: statusEnum('status').default('pending'),
  operator: varchar('operator', { length: 100 }).notNull(),
  operatorId: uuid('operator_id').references(() => users.id),
  details: text('details').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true })
});

export const todoItems = pgTable('todo_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: todoTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  assignee: varchar('assignee', { length: 100 }).notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id),
  status: statusEnum('status').default('pending'),
  priority: priorityEnum('priority').default('medium'),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  complianceRecordId: uuid('compliance_record_id').references(() => complianceRecords.id)
});

export const riskAlerts = pgTable('risk_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  reagentId: uuid('reagent_id').references(() => reagents.id),
  reagentName: varchar('reagent_name', { length: 255 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  userName: varchar('user_name', { length: 100 }).notNull(),
  riskType: varchar('risk_type', { length: 100 }).notNull(),
  riskLevel: hazardLevelEnum('risk_level').default('medium'),
  description: text('description').notNull(),
  status: statusEnum('status').default('pending'),
  resolution: text('resolution'),
  complianceRecordId: uuid('compliance_record_id').references(() => complianceRecords.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true })
});

export const experiments = pgTable('experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  data: text('data').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }).defaultNow(),
  complianceRecordId: uuid('compliance_record_id').references(() => complianceRecords.id)
});
