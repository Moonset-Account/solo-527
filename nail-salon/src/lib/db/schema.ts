import { pgTable, uuid, varchar, text, integer, numeric, timestamp, boolean, date, jsonb } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  gender: varchar('gender', { length: 10 }),
  birthday: date('birthday'),
  source: varchar('source', { length: 50 }),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const technicians = pgTable('technicians', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  avatar: text('avatar'),
  specialty: varchar('specialty', { length: 200 }),
  level: varchar('level', { length: 20 }).default('junior'),
  bio: text('bio'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  duration: integer('duration').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  image: text('image'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  technicianId: uuid('technician_id').references(() => technicians.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  appointmentDate: date('appointment_date').notNull(),
  appointmentTime: varchar('appointment_time', { length: 10 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const cashierRecords = pgTable('cashier_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  technicianId: uuid('technician_id').references(() => technicians.id),
  serviceId: uuid('service_id').references(() => services.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 30 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  treatmentCardId: uuid('treatment_card_id').references(() => treatmentCards.id),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const treatmentCards = pgTable('treatment_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  serviceName: varchar('service_name', { length: 100 }).notNull(),
  totalSessions: integer('total_sessions').notNull(),
  usedSessions: integer('used_sessions').default(0).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  startDate: date('start_date').notNull(),
  expireDate: date('expire_date').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const works = pgTable('works', {
  id: uuid('id').defaultRandom().primaryKey(),
  technicianId: uuid('technician_id').references(() => technicians.id).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  images: jsonb('images').notNull().default([]),
  description: text('description'),
  tags: jsonb('tags').default([]),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workId: uuid('work_id').references(() => works.id).notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  authorName: varchar('author_name', { length: 100 }),
  content: text('content').notNull(),
  rating: integer('rating'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at')
});

export const reminderRules = pgTable('reminder_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(),
  conditionDays: integer('condition_days').notNull(),
  urgencyLevel: varchar('urgency_level', { length: 20 }).notNull(),
  messageTemplate: text('message_template'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const reminders = pgTable('reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id).notNull(),
  ruleId: uuid('rule_id').references(() => reminderRules.id).notNull(),
  treatmentCardId: uuid('treatment_card_id').references(() => treatmentCards.id),
  urgencyLevel: varchar('urgency_level', { length: 20 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  dueDate: date('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  handledAt: timestamp('handled_at'),
  handlerRemark: text('handler_remark')
});

export const operationHistory = pgTable('operation_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  operatorName: varchar('operator_name', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  targetType: varchar('target_type', { length: 30 }).notNull(),
  targetId: uuid('target_id'),
  detail: text('detail'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
