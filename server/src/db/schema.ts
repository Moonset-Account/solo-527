import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  date,
  decimal,
  boolean,
  json,
  enum as pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
  'refunded',
]);

export const refundStatusEnum = pgEnum('refund_status', [
  'pending',
  'approved',
  'rejected',
  'completed',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'follow_up',
  'resolved',
  'escalated',
]);

export const sourceEnum = pgEnum('source', [
  'online',
  'phone',
  'walk_in',
  'referral',
  'third_party',
]);

export const delayReasonEnum = pgEnum('delay_reason', [
  'technician_shortage',
  'parts_unavailable',
  'customer_reschedule',
  'weather',
  'traffic',
  'complex_repair',
  'other',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  address: text('address'),
  city: varchar('city', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const technicians = pgTable('technicians', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  skillLevel: integer('skill_level').default(1).notNull(),
  city: varchar('city', { length: 50 }),
  dailyCapacity: integer('daily_capacity').default(5).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cityManagers = pgTable('city_managers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  city: varchar('city', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNo: varchar('order_no', { length: 32 }).notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  technicianId: integer('technician_id').references(() => technicians.id),
  cityManagerId: integer('city_manager_id').references(() => cityManagers.id),
  applianceType: varchar('appliance_type', { length: 50 }).notNull(),
  applianceBrand: varchar('appliance_brand', { length: 50 }),
  faultDescription: text('fault_description').notNull(),
  address: text('address').notNull(),
  city: varchar('city', { length: 50 }),
  status: orderStatusEnum('status').default('pending').notNull(),
  source: sourceEnum('source').default('online').notNull(),
  scheduledDate: date('scheduled_date').notNull(),
  scheduledTimeSlot: varchar('scheduled_time_slot', { length: 20 }),
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),
  isOnTime: boolean('is_on_time'),
  delayReason: delayReasonEnum('delay_reason'),
  delayDescription: text('delay_description'),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderPhotos = pgTable('order_photos', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  photoUrl: text('photo_url').notNull(),
  photoType: varchar('photo_type', { length: 20 }).default('fault'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  status: reviewStatusEnum('status').default('pending').notNull(),
  followUpNote: text('follow_up_note'),
  followedBy: integer('followed_by').references(() => cityManagers.id),
  followedAt: timestamp('followed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const refunds = pgTable('refunds', {
  id: serial('id').primaryKey(),
  refundNo: varchar('refund_no', { length: 32 }).notNull().unique(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  userId: integer('user_id').references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  status: refundStatusEnum('status').default('pending').notNull(),
  handledBy: integer('handled_by').references(() => cityManagers.id),
  handledAt: timestamp('handled_at'),
  handleNote: text('handle_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rescheduleLogs = pgTable('reschedule_logs', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  oldDate: date('old_date'),
  newDate: date('new_date'),
  oldTimeSlot: varchar('old_time_slot', { length: 20 }),
  newTimeSlot: varchar('new_time_slot', { length: 20 }),
  reason: text('reason'),
  operatorType: varchar('operator_type', { length: 20 }),
  operatorId: integer('operator_id'),
  isCancellation: boolean('is_cancellation').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const technicianLoads = pgTable('technician_loads', {
  id: serial('id').primaryKey(),
  technicianId: integer('technician_id').references(() => technicians.id).notNull(),
  date: date('date').notNull(),
  assignedCount: integer('assigned_count').default(0).notNull(),
  completedCount: integer('completed_count').default(0).notNull(),
  loadRate: decimal('load_rate', { precision: 5, scale: 2 }).default(0).notNull(),
  city: varchar('city', { length: 50 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  reviews: many(reviews),
  refunds: many(refunds),
}));

export const techniciansRelations = relations(technicians, ({ many }) => ({
  orders: many(orders),
  loads: many(technicianLoads),
}));

export const cityManagersRelations = relations(cityManagers, ({ many }) => ({
  orders: many(orders),
  handledRefunds: many(refunds, { relationName: 'handledBy' }),
  followedReviews: many(reviews, { relationName: 'followedBy' }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  technician: one(technicians, { fields: [orders.technicianId], references: [technicians.id] }),
  cityManager: one(cityManagers, { fields: [orders.cityManagerId], references: [cityManagers.id] }),
  photos: many(orderPhotos),
  review: one(reviews, { fields: [orders.id], references: [reviews.orderId] }),
  refunds: many(refunds),
  rescheduleLogs: many(rescheduleLogs),
}));
