import { pgTable, serial, varchar, integer, numeric, date, timestamp, text, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('consultant'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  lastLogin: timestamp('last_login').$type<string | Date>(),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$type<string | Date>(),
});

export const apartments = pgTable('apartments', {
  id: serial('id').primaryKey(),
  apartmentNo: varchar('apartment_no', { length: 50 }).unique().notNull(),
  building: varchar('building', { length: 50 }),
  floor: integer('floor'),
  area: numeric('area', { precision: 10, scale: 2 }).$type<number>(),
  layout: varchar('layout', { length: 20 }),
  orientation: varchar('orientation', { length: 10 }),
  decoration: varchar('decoration', { length: 20 }),
  status: varchar('status', { length: 20 }).notNull().default('vacant'),
  monthlyRent: numeric('monthly_rent', { precision: 10, scale: 2 }).$type<number>(),
  depositMonths: integer('deposit_months').default(1),
  description: text('description'),
  facilities: jsonb('facilities').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$type<string | Date>(),
});

export const priceHistory = pgTable('price_history', {
  id: serial('id').primaryKey(),
  apartmentId: integer('apartment_id').references(() => apartments.id).notNull(),
  monthlyRent: numeric('monthly_rent', { precision: 10, scale: 2 }).notNull().$type<number>(),
  effectiveDate: date('effective_date').notNull().$type<string | Date>(),
  reason: text('reason'),
  operatorId: integer('operator_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  idCard: varchar('id_card', { length: 18 }),
  source: varchar('source', { length: 50 }),
  requirements: text('requirements'),
  consultantId: integer('consultant_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
});

export const viewings = pgTable('viewings', {
  id: serial('id').primaryKey(),
  apartmentId: integer('apartment_id').references(() => apartments.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  consultantId: integer('consultant_id').references(() => users.id).notNull(),
  viewingDate: timestamp('viewing_date').notNull().$type<string | Date>(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  note: text('note'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
});

export const followUps = pgTable('follow_ups', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  apartmentId: integer('apartment_id').references(() => apartments.id),
  consultantId: integer('consultant_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  content: text('content').notNull(),
  nextFollowDate: timestamp('next_follow_date').$type<string | Date>(),
  result: varchar('result', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
});

export const leaseDrafts = pgTable('lease_drafts', {
  id: serial('id').primaryKey(),
  apartmentId: integer('apartment_id').references(() => apartments.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  consultantId: integer('consultant_id').references(() => users.id).notNull(),
  startDate: date('start_date').notNull().$type<string | Date>(),
  endDate: date('end_date').notNull().$type<string | Date>(),
  monthlyRent: numeric('monthly_rent', { precision: 10, scale: 2 }).notNull().$type<number>(),
  depositAmount: numeric('deposit_amount', { precision: 10, scale: 2 }).notNull().$type<number>(),
  paymentCycle: integer('payment_cycle').notNull().default(1),
  terms: text('terms'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$type<string | Date>(),
});

export const leases = pgTable('leases', {
  id: serial('id').primaryKey(),
  apartmentId: integer('apartment_id').references(() => apartments.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  consultantId: integer('consultant_id').references(() => users.id).notNull(),
  startDate: date('start_date').notNull().$type<string | Date>(),
  endDate: date('end_date').notNull().$type<string | Date>(),
  monthlyRent: numeric('monthly_rent', { precision: 10, scale: 2 }).notNull().$type<number>(),
  depositAmount: numeric('deposit_amount', { precision: 10, scale: 2 }).notNull().$type<number>(),
  paymentCycle: integer('payment_cycle').notNull().default(1),
  terms: text('terms'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  signedAt: timestamp('signed_at').$type<string | Date>(),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
});

export const deposits = pgTable('deposits', {
  id: serial('id').primaryKey(),
  leaseId: integer('lease_id').references(() => leases.id).notNull(),
  apartmentId: integer('apartment_id').references(() => apartments.id).notNull(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull().$type<number>(),
  receivedDate: date('received_date').notNull().$type<string | Date>(),
  status: varchar('status', { length: 20 }).notNull().default('held'),
  refundDate: date('refund_date').$type<string | Date>(),
  refundAmount: numeric('refund_amount', { precision: 10, scale: 2 }).$type<number>(),
  deductionReason: text('deduction_reason'),
  hasDispute: boolean('has_dispute').default(false),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$type<string | Date>(),
});

export const depositDisputes = pgTable('deposit_disputes', {
  id: serial('id').primaryKey(),
  depositId: integer('deposit_id').references(() => deposits.id).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  disputedAmount: numeric('disputed_amount', { precision: 10, scale: 2 }).notNull().$type<number>(),
  handlerId: integer('handler_id').references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  closeNote: text('close_note'),
  closedAt: timestamp('closed_at').$type<string | Date>(),
  closedBy: integer('closed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
});

export const vacancyReminders = pgTable('vacancy_reminders', {
  id: serial('id').primaryKey(),
  apartmentId: integer('apartment_id').references(() => apartments.id).notNull(),
  leaseEndDate: date('lease_end_date').notNull().$type<string | Date>(),
  reminderDate: date('reminder_date').notNull().$type<string | Date>(),
  type: varchar('type', { length: 20 }).notNull().default('upcoming'),
  processed: boolean('processed').default(false),
  processedById: integer('processed_by').references(() => users.id),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
});

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  refId: integer('ref_id').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  priority: varchar('priority', { length: 10 }).default('normal'),
  assigneeId: integer('assignee_id').references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  dueDate: timestamp('due_date').$type<string | Date>(),
  closeNote: text('close_note'),
  closedAt: timestamp('closed_at').$type<string | Date>(),
  closedBy: integer('closed_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull().$type<string | Date>(),
});

export const apartmentsRelations = relations(apartments, ({ many }) => ({
  priceHistory: many(priceHistory),
  viewings: many(viewings),
  followUps: many(followUps),
  leaseDrafts: many(leaseDrafts),
  leases: many(leases),
  deposits: many(deposits),
  vacancyReminders: many(vacancyReminders),
}));

export const customersRelations = relations(customers, ({ many, one }) => ({
  consultant: one(users, { fields: [customers.consultantId], references: [users.id] }),
  viewings: many(viewings),
  followUps: many(followUps),
  leaseDrafts: many(leaseDrafts),
  leases: many(leases),
  deposits: many(deposits),
}));

export const usersRelations = relations(users, ({ many }) => ({
  assignedCustomers: many(customers),
  viewings: many(viewings),
  followUps: many(followUps),
  leaseDrafts: many(leaseDrafts),
  leases: many(leases),
}));
