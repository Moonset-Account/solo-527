import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'operator', 'member']);
export const campStatusEnum = pgEnum('camp_status', ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled']);
export const chapterStatusEnum = pgEnum('chapter_status', ['draft', 'published']);
export const memberStatusEnum = pgEnum('member_status', ['active', 'expired', 'refunded', 'paused']);
export const checkinStatusEnum = pgEnum('checkin_status', ['pending', 'approved', 'rejected']);
export const todoStatusEnum = pgEnum('todo_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const todoPriorityEnum = pgEnum('todo_priority', ['low', 'medium', 'high', 'urgent']);
export const todoTypeEnum = pgEnum('todo_type', ['fall_behind_warning', 'checkin_review', 'refund_review', 'custom']);
export const refundStatusEnum = pgEnum('refund_status', ['pending', 'approved', 'rejected', 'processed']);
export const conversionSourceEnum = pgEnum('conversion_source', [
  'wechat_group',
  'wechat_moments',
  'douyin',
  'xiaohongshu',
  'zhihu',
  'referral',
  'offline',
  'other',
]);
export const materialTypeEnum = pgEnum('material_type', ['pdf', 'video', 'audio', 'image', 'zip', 'other']);
export const benefitTypeEnum = pgEnum('benefit_type', ['discount', 'gift', 'service', 'other']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum('role').notNull().default('member'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  roleIdx: index('users_role_idx').on(t.role),
}));

export const trainingCamps = pgTable('training_camps', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  status: campStatusEnum('status').notNull().default('draft'),
  maxMembers: integer('max_members').notNull().default(100),
  currentMembers: integer('current_members').notNull().default(0),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  operatorId: uuid('operator_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  statusIdx: index('camps_status_idx').on(t.status),
  dateIdx: index('camps_date_idx').on(t.startDate, t.endDate),
}));

export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  campId: uuid('camp_id').notNull().references(() => trainingCamps.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  videoUrl: text('video_url'),
  duration: integer('duration').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
  status: chapterStatusEnum('status').notNull().default('draft'),
  isPreview: boolean('is_preview').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  campIdx: index('chapters_camp_idx').on(t.campId),
  statusIdx: index('chapters_status_idx').on(t.status),
}));

export const chapterMaterials = pgTable('chapter_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 300 }).notNull(),
  type: materialTypeEnum('type').notNull().default('other'),
  url: text('url').notNull(),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  chapterIdx: index('chapter_materials_chapter_idx').on(t.chapterId),
}));

export const campMaterials = pgTable('camp_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  campId: uuid('camp_id').notNull().references(() => trainingCamps.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 300 }).notNull(),
  type: materialTypeEnum('type').notNull().default('other'),
  url: text('url').notNull(),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  campIdx: index('camp_materials_camp_idx').on(t.campId),
}));

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  campId: uuid('camp_id').notNull().references(() => trainingCamps.id, { onDelete: 'cascade' }),
  memberNo: varchar('member_no', { length: 50 }).notNull().unique(),
  status: memberStatusEnum('status').notNull().default('active'),
  joinDate: timestamp('join_date', { withTimezone: true }).notNull().defaultNow(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  conversionSource: conversionSourceEnum('conversion_source').notNull().default('other'),
  conversionSourceDetail: text('conversion_source_detail'),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  progress: numeric('progress', { precision: 5, scale: 2 }).notNull().default('0'),
  totalChapters: integer('total_chapters').notNull().default(0),
  completedChapters: integer('completed_chapters').notNull().default(0),
  isFallingBehind: boolean('is_falling_behind').notNull().default(false),
  salesPerson: varchar('sales_person', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('members_user_idx').on(t.userId),
  campIdx: index('members_camp_idx').on(t.campId),
  statusIdx: index('members_status_idx').on(t.status),
  conversionIdx: index('members_conversion_idx').on(t.conversionSource),
  fallingIdx: index('members_falling_idx').on(t.isFallingBehind),
}));

export const memberProgress = pgTable('member_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  watchDuration: integer('watch_duration').notNull().default(0),
  lastWatchedAt: timestamp('last_watched_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  memberIdx: index('progress_member_idx').on(t.memberId),
  chapterIdx: index('progress_chapter_idx').on(t.chapterId),
  uniqueIdx: uniqueIndex('progress_unique_idx').on(t.memberId, t.chapterId),
}));

export const checkinRecords = pgTable('checkin_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  campId: uuid('camp_id').notNull().references(() => trainingCamps.id, { onDelete: 'cascade' }),
  content: text('content'),
  imageUrls: text('image_urls').array(),
  status: checkinStatusEnum('status').notNull().default('pending'),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewComment: text('review_comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  memberIdx: index('checkin_member_idx').on(t.memberId),
  chapterIdx: index('checkin_chapter_idx').on(t.chapterId),
  campIdx: index('checkin_camp_idx').on(t.campId),
  statusIdx: index('checkin_status_idx').on(t.status),
  dateIdx: index('checkin_date_idx').on(t.checkedInAt),
}));

export const refundRules = pgTable('refund_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  campId: uuid('camp_id').notNull().references(() => trainingCamps.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  daysFromJoin: integer('days_from_join').notNull().default(0),
  refundRate: numeric('refund_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  campIdx: index('refund_rules_camp_idx').on(t.campId),
}));

export const refundRequests = pgTable('refund_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  ruleId: uuid('rule_id').references(() => refundRules.id),
  reason: text('reason').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  status: refundStatusEnum('status').notNull().default('pending'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  processedBy: uuid('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  processComment: text('process_comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  memberIdx: index('refund_member_idx').on(t.memberId),
  statusIdx: index('refund_status_idx').on(t.status),
  dateIdx: index('refund_date_idx').on(t.requestedAt),
}));

export const memberBenefits = pgTable('member_benefits', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  type: benefitTypeEnum('type').notNull().default('other'),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  value: numeric('value', { precision: 10, scale: 2 }),
  isUsed: boolean('is_used').notNull().default(false),
  usedAt: timestamp('used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  memberIdx: index('benefits_member_idx').on(t.memberId),
  usedIdx: index('benefits_used_idx').on(t.isUsed),
}));

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  type: todoTypeEnum('type').notNull().default('custom'),
  priority: todoPriorityEnum('priority').notNull().default('medium'),
  status: todoStatusEnum('status').notNull().default('pending'),
  assigneeId: uuid('assignee_id').references(() => users.id),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }),
  campId: uuid('camp_id').references(() => trainingCamps.id, { onDelete: 'cascade' }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: uuid('completed_by').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  statusIdx: index('todos_status_idx').on(t.status),
  priorityIdx: index('todos_priority_idx').on(t.priority),
  assigneeIdx: index('todos_assignee_idx').on(t.assigneeId),
  memberIdx: index('todos_member_idx').on(t.memberId),
  campIdx: index('todos_camp_idx').on(t.campId),
  dueIdx: index('todos_due_idx').on(t.dueDate),
}));

