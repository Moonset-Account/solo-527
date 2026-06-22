import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  date,
  jsonb,
  decimal,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['staff', 'admin', 'coach_supervisor', 'manager']);

export const deviceStatusEnum = pgEnum('device_status', [
  'normal',
  'warning',
  'fault',
  'maintenance',
]);

export const inspectionStatusEnum = pgEnum('inspection_status', ['normal', 'abnormal']);

export const repairStatusEnum = pgEnum('repair_status', [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'verified',
  'closed',
]);

export const scheduleStatusEnum = pgEnum('schedule_status', ['scheduled', 'cancelled', 'completed']);

export const eventStatusEnum = pgEnum('event_status', ['scheduled', 'rescheduled', 'cancelled', 'completed', 'closed']);

export const waitlistStatusEnum = pgEnum('waitlist_status', ['waiting', 'notified', 'enrolled', 'cancelled']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: roleEnum('role').notNull().default('staff'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const devices = pgTable('devices', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  location: varchar('location', { length: 100 }).notNull(),
  status: deviceStatusEnum('status').notNull().default('normal'),
  description: text('description'),
  purchaseDate: date('purchase_date'),
  lastInspectionDate: date('last_inspection_date'),
  nextInspectionDate: date('next_inspection_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const inspectionRecords = pgTable('inspection_records', {
  id: serial('id').primaryKey(),
  deviceId: integer('device_id').references(() => devices.id).notNull(),
  inspectorId: integer('inspector_id').references(() => users.id).notNull(),
  inspectionDate: timestamp('inspection_date').defaultNow().notNull(),
  status: inspectionStatusEnum('status').notNull(),
  description: text('description'),
  temperature: decimal('temperature', { precision: 5, scale: 2 }),
  phValue: decimal('ph_value', { precision: 4, scale: 2 }),
  chlorineLevel: decimal('chlorine_level', { precision: 4, scale: 2 }),
  images: jsonb('images').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const repairOrders = pgTable('repair_orders', {
  id: serial('id').primaryKey(),
  deviceId: integer('device_id').references(() => devices.id).notNull(),
  inspectionRecordId: integer('inspection_record_id').references(() => inspectionRecords.id),
  reporterId: integer('reporter_id').references(() => users.id).notNull(),
  assigneeId: integer('assignee_id').references(() => users.id),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  priority: integer('priority').default(1),
  status: repairStatusEnum('status').notNull().default('pending'),
  reportedAt: timestamp('reported_at').defaultNow().notNull(),
  assignedAt: timestamp('assigned_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  verifiedAt: timestamp('verified_at'),
  closedAt: timestamp('closed_at'),
  repairNotes: text('repair_notes'),
  verificationNotes: text('verification_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const operationLogs = pgTable('operation_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  targetId: integer('target_id'),
  details: jsonb('details'),
  ip: varchar('ip', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const coachSchedules = pgTable('coach_schedules', {
  id: serial('id').primaryKey(),
  coachId: integer('coach_id').references(() => users.id).notNull(),
  date: date('date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  location: varchar('location', { length: 100 }),
  courseType: varchar('course_type', { length: 50 }),
  maxStudents: integer('max_students').default(10),
  status: scheduleStatusEnum('status').notNull().default('scheduled'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pricingRules = pgTable('pricing_rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  duration: integer('duration'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  validFrom: date('valid_from'),
  validTo: date('valid_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const waitlist = pgTable('waitlist', {
  id: serial('id').primaryKey(),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  courseType: varchar('course_type', { length: 50 }),
  preferredCoach: varchar('preferred_coach', { length: 100 }),
  preferredTime: varchar('preferred_time', { length: 100 }),
  status: waitlistStatusEnum('status').notNull().default('waiting'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  originalDate: date('original_date').notNull(),
  currentDate: date('current_date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  location: varchar('location', { length: 200 }).notNull(),
  organizer: varchar('organizer', { length: 100 }),
  participants: integer('participants').default(0),
  status: eventStatusEnum('status').notNull().default('scheduled'),
  rescheduleReason: text('reschedule_reason'),
  closedAt: timestamp('closed_at'),
  closedBy: integer('closed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const venueUsageReports = pgTable('venue_usage_reports', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  totalHours: decimal('total_hours', { precision: 5, scale: 2 }).default('0'),
  usedHours: decimal('used_hours', { precision: 5, scale: 2 }).default('0'),
  utilizationRate: decimal('utilization_rate', { precision: 5, scale: 2 }).default('0'),
  eventCount: integer('event_count').default(0),
  courseCount: integer('course_count').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const savedFilters = pgTable('saved_filters', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  filters: jsonb('filters').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
