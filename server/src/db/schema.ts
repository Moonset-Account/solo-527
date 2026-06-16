import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  date,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const membershipPlans = pgTable('membership_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  durationDays: integer('duration_days').notNull(),
  features: jsonb('features').default({}),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  planId: integer('plan_id').references(() => membershipPlans.id).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: text('status').notNull().default('active'),
  autoRenew: boolean('auto_renew').notNull().default(true),
  owner: text('owner'),
  renewCount: integer('renew_count').notNull().default(0),
  canceledAt: timestamp('canceled_at'),
  cancelReason: text('cancel_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNo: text('order_no').unique().notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  subscriptionId: integer('subscription_id').references(() => subscriptions.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'),
  paidAt: timestamp('paid_at'),
  owner: text('owner'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderNodes = pgTable('order_nodes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').unique().notNull(),
  description: text('description'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderNodeLogs = pgTable('order_node_logs', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  nodeId: integer('node_id').references(() => orderNodes.id).notNull(),
  status: text('status').notNull().default('pending'),
  operator: text('operator'),
  note: text('note'),
  executedAt: timestamp('executed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const materials = pgTable('materials', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  licenseType: text('license_type').notNull(),
  fee: numeric('fee', { precision: 10, scale: 2 }).notNull().default('0'),
  owner: text('owner'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const materialLicenses = pgTable('material_licenses', {
  id: serial('id').primaryKey(),
  materialId: integer('material_id').references(() => materials.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  orderId: integer('order_id').references(() => orders.id),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const podcastContents = pgTable('podcast_contents', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  audioUrl: text('audio_url'),
  isMemberOnly: boolean('is_member_only').notNull().default(false),
  publishDate: timestamp('publish_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const revenues = pgTable('revenues', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  type: text('type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  orderId: integer('order_id').references(() => orders.id),
  owner: text('owner'),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const costs = pgTable('costs', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  type: text('type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  materialId: integer('material_id').references(() => materials.id),
  owner: text('owner'),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const exceptionPool = pgTable('exception_pool', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  relatedOrderId: integer('related_order_id').references(() => orders.id),
  delayDays: integer('delay_days').default(0),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('open'),
  assignee: text('assignee'),
  closer: text('closer'),
  closeReason: text('close_reason'),
  resultSummary: text('result_summary'),
  resultNote: text('result_note'),
  reopenedFrom: integer('reopened_from'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
});

export const exceptionLogs = pgTable('exception_logs', {
  id: serial('id').primaryKey(),
  exceptionId: integer('exception_id').references(() => exceptionPool.id).notNull(),
  action: text('action').notNull(),
  operator: text('operator'),
  detail: jsonb('detail').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ruleVersions = pgTable('rule_versions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  version: text('version').notNull(),
  content: jsonb('content').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(false),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  activatedAt: timestamp('activated_at'),
});

export const featureToggles = pgTable('feature_toggles', {
  id: serial('id').primaryKey(),
  featureKey: text('feature_key').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isEnabled: boolean('is_enabled').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  orders: many(orders),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  plan: one(membershipPlans, { fields: [subscriptions.planId], references: [membershipPlans.id] }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  subscription: one(subscriptions, { fields: [orders.subscriptionId], references: [subscriptions.id] }),
  nodeLogs: many(orderNodeLogs),
}));

export const exceptionsRelations = relations(exceptionPool, ({ many }) => ({
  logs: many(exceptionLogs),
}));
