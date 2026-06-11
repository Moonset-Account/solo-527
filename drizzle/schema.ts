import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  boolean,
  integer,
  decimal,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['host', 'operator']);
export const planTypeEnum = pgEnum('plan_type', ['monthly', 'quarterly', 'yearly']);
export const materialAuthStatusEnum = pgEnum('material_auth_status', [
  'pending',
  'approved',
  'rejected'
]);
export const invoiceCycleEnum = pgEnum('invoice_cycle', ['monthly', 'quarterly', 'yearly']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'expiring',
  'expired',
  'cancelled'
]);
export const todoTypeEnum = pgEnum('todo_type', ['material_auth', 'invoice_cycle', 'subscription']);
export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);
export const todoStatusEnum = pgEnum('todo_status', ['pending', 'processing', 'done']);
export const exceptionStatusEnum = pgEnum('exception_status', [
  'unconfirmed',
  'confirmed',
  'resolved'
]);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'delivering',
  'completed',
  'refunded'
]);
export const deliveryNodeStatusEnum = pgEnum('delivery_node_status', [
  'pending',
  'in_progress',
  'completed'
]);
export const alertStatusEnum = pgEnum('alert_status', ['active', 'acknowledged', 'resolved']);
export const httpMethodEnum = pgEnum('http_method', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  hostId: uuid('host_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const memberSubscriptions = pgTable('member_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .references(() => members.id)
    .notNull(),
  brandId: uuid('brand_id')
    .references(() => brands.id)
    .notNull(),
  planType: planTypeEnum('plan_type').notNull(),
  materialAuthStatus: materialAuthStatusEnum('material_auth_status').notNull().default('pending'),
  invoiceCycle: invoiceCycleEnum('invoice_cycle').notNull().default('monthly'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull().default('active'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const todoItems = pgTable('todo_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  type: todoTypeEnum('type').notNull(),
  priority: priorityEnum('priority').notNull().default('medium'),
  materialAuthStatus: materialAuthStatusEnum('material_auth_status'),
  invoiceCycle: invoiceCycleEnum('invoice_cycle'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status'),
  relatedBrandId: uuid('related_brand_id').references(() => brands.id),
  relatedMemberId: uuid('related_member_id').references(() => members.id),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  status: todoStatusEnum('status').notNull().default('pending'),
  assigneeId: uuid('assignee_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const exceptions = pgTable('exceptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id')
    .references(() => brands.id)
    .notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(),
  status: exceptionStatusEnum('status').notNull().default('unconfirmed'),
  result: text('result'),
  remark: text('remark'),
  hostId: uuid('host_id').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNo: varchar('order_no', { length: 50 }).unique().notNull(),
  memberId: uuid('member_id')
    .references(() => members.id)
    .notNull(),
  brandId: uuid('brand_id')
    .references(() => brands.id)
    .notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const deliveryNodes = pgTable('delivery_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .references(() => orders.id)
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  status: deliveryNodeStatusEnum('status').notNull().default('pending'),
  assigneeId: uuid('assignee_id').references(() => users.id),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  deadline: timestamp('deadline', { withTimezone: true }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0)
});

export const retentionAlerts = pgTable('retention_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id')
    .references(() => brands.id)
    .notNull(),
  metric: varchar('metric', { length: 50 }).notNull(),
  currentValue: decimal('current_value', { precision: 10, scale: 2 }).notNull(),
  threshold: decimal('threshold', { precision: 10, scale: 2 }).notNull(),
  ownerId: uuid('owner_id')
    .references(() => users.id)
    .notNull(),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),
  status: alertStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const apiLogs = pgTable('api_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  endpoint: varchar('endpoint', { length: 500 }).notNull(),
  method: httpMethodEnum('method').notNull(),
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  lastRetryAt: timestamp('last_retry_at', { withTimezone: true }),
  retryCount: integer('retry_count').notNull().default(0),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull()
});

export const brandsRelations = relations(brands, ({ one, many }) => ({
  host: one(users, { fields: [brands.hostId], references: [users.id] }),
  subscriptions: many(memberSubscriptions),
  exceptions: many(exceptions),
  orders: many(orders),
  alerts: many(retentionAlerts)
}));

export const membersRelations = relations(members, ({ many }) => ({
  subscriptions: many(memberSubscriptions),
  orders: many(orders)
}));

export const memberSubscriptionsRelations = relations(memberSubscriptions, ({ one }) => ({
  member: one(members, { fields: [memberSubscriptions.memberId], references: [members.id] }),
  brand: one(brands, { fields: [memberSubscriptions.brandId], references: [brands.id] })
}));

export const todoItemsRelations = relations(todoItems, ({ one }) => ({
  assignee: one(users, { fields: [todoItems.assigneeId], references: [users.id] }),
  brand: one(brands, { fields: [todoItems.relatedBrandId], references: [brands.id] }),
  member: one(members, { fields: [todoItems.relatedMemberId], references: [members.id] })
}));

export const exceptionsRelations = relations(exceptions, ({ one }) => ({
  brand: one(brands, { fields: [exceptions.brandId], references: [brands.id] }),
  host: one(users, { fields: [exceptions.hostId], references: [users.id] })
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  member: one(members, { fields: [orders.memberId], references: [members.id] }),
  brand: one(brands, { fields: [orders.brandId], references: [brands.id] }),
  deliveryNodes: many(deliveryNodes)
}));

export const deliveryNodesRelations = relations(deliveryNodes, ({ one }) => ({
  order: one(orders, { fields: [deliveryNodes.orderId], references: [orders.id] }),
  assignee: one(users, { fields: [deliveryNodes.assigneeId], references: [users.id] })
}));

export const retentionAlertsRelations = relations(retentionAlerts, ({ one }) => ({
  brand: one(brands, { fields: [retentionAlerts.brandId], references: [brands.id] }),
  owner: one(users, { fields: [retentionAlerts.ownerId], references: [users.id] })
}));
