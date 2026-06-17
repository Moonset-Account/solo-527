import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const memberLevels = pgTable(
  'member_levels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 50 }).notNull(),
    minGrowth: integer('min_growth').default(0).notNull(),
    icon: varchar('icon', { length: 100 }),
    benefits: text('benefits'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    sortOrderIdx: index('member_levels_sort_order_idx').on(table.sortOrder),
  })
);

export const members = pgTable(
  'members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    phone: varchar('phone', { length: 20 }).notNull(),
    nickname: varchar('nickname', { length: 50 }),
    avatar: varchar('avatar_url', { length: 255 }),
    points: integer('points').default(0).notNull(),
    levelId: uuid('level_id').references(() => memberLevels.id),
    growthValue: integer('growth_value').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    phoneUnique: uniqueIndex('members_phone_unique').on(table.phone),
    levelIdIdx: index('members_level_id_idx').on(table.levelId),
    pointsIdx: index('members_points_idx').on(table.points),
  })
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    imageUrl: varchar('image_url', { length: 255 }),
    pointsPrice: integer('points_price').notNull(),
    stock: integer('stock').default(0).notNull(),
    soldCount: integer('sold_count').default(0).notNull(),
    category: varchar('category', { length: 50 }),
    requiredLevelId: uuid('required_level_id').references(() => memberLevels.id),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('products_status_idx').on(table.status),
    categoryIdx: index('products_category_idx').on(table.category),
    pointsPriceIdx: index('products_points_price_idx').on(table.pointsPrice),
    requiredLevelIdIdx: index('products_required_level_id_idx').on(table.requiredLevelId),
  })
);

export const exchangeOrders = pgTable(
  'exchange_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNo: varchar('order_no', { length: 32 }).notNull(),
    memberId: uuid('member_id')
      .references(() => members.id)
      .notNull(),
    productId: uuid('product_id')
      .references(() => products.id)
      .notNull(),
    quantity: integer('quantity').default(1).notNull(),
    totalPoints: integer('total_points').notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    redeemCode: varchar('redeem_code', { length: 32 }),
    redeemedAt: timestamp('redeemed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    orderNoUnique: uniqueIndex('exchange_orders_order_no_unique').on(table.orderNo),
    redeemCodeUnique: uniqueIndex('exchange_orders_redeem_code_unique').on(table.redeemCode),
    memberIdIdx: index('exchange_orders_member_id_idx').on(table.memberId),
    productIdIdx: index('exchange_orders_product_id_idx').on(table.productId),
    statusIdx: index('exchange_orders_status_idx').on(table.status),
    createdAtIdx: index('exchange_orders_created_at_idx').on(table.createdAt),
  })
);

export const pointTransactions = pgTable(
  'point_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .references(() => members.id)
      .notNull(),
    points: integer('points').notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    reason: varchar('reason', { length: 200 }),
    refId: uuid('ref_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    memberIdIdx: index('point_transactions_member_id_idx').on(table.memberId),
    typeIdx: index('point_transactions_type_idx').on(table.type),
    createdAtIdx: index('point_transactions_created_at_idx').on(table.createdAt),
  })
);

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 50 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).default('ecommerce').notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    usernameUnique: uniqueIndex('admin_users_username_unique').on(table.username),
  })
);

export const reachTasks = pgTable(
  'reach_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).default('draft').notNull(),
    totalCount: integer('total_count').default(0).notNull(),
    successCount: integer('success_count').default(0).notNull(),
    failedCount: integer('failed_count').default(0).notNull(),
    filterCriteria: jsonb('filter_criteria'),
    createdBy: uuid('created_by').references(() => adminUsers.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('reach_tasks_status_idx').on(table.status),
    createdByIdx: index('reach_tasks_created_by_idx').on(table.createdBy),
    createdAtIdx: index('reach_tasks_created_at_idx').on(table.createdAt),
  })
);

export const reachLogs = pgTable(
  'reach_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .references(() => reachTasks.id)
      .notNull(),
    memberId: uuid('member_id').references(() => members.id),
    memberPhone: varchar('member_phone', { length: 20 }),
    status: varchar('status', { length: 20 }).notNull(),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    taskIdIdx: index('reach_logs_task_id_idx').on(table.taskId),
    statusIdx: index('reach_logs_status_idx').on(table.status),
    memberIdIdx: index('reach_logs_member_id_idx').on(table.memberId),
  })
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => adminUsers.id),
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 50 }),
    resourceId: uuid('resource_id'),
    details: jsonb('details'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  })
);

export const redeemRecords = pgTable(
  'redeem_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .references(() => exchangeOrders.id)
      .notNull(),
    adminUserId: uuid('admin_user_id').references(() => adminUsers.id),
    remark: varchar('remark', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('redeem_records_order_id_idx').on(table.orderId),
    adminUserIdIdx: index('redeem_records_admin_user_id_idx').on(table.adminUserId),
  })
);
