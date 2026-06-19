import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  bigint,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const scheduleStatusEnum = pgEnum('schedule_status', [
  'draft',
  'scheduled',
  'published',
  'failed',
]);

export const exceptionStatusEnum = pgEnum('exception_status', [
  'open',
  'processing',
  'closed',
]);

export const materials = pgTable('materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileUrl: text('file_url'),
  fileType: varchar('file_type', { length: 50 }),
  uploadedBy: varchar('uploaded_by', { length: 100 }).notNull(),
  reuseCount: integer('reuse_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 7 }).default('#3b82f6'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const materialTags = pgTable('material_tags', {
  materialId: uuid('material_id').references(() => materials.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
});

export const topicScripts = pgTable('topic_scripts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  materialId: uuid('material_id').references(() => materials.id),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const publishSchedules = pgTable('publish_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  scriptId: uuid('script_id').references(() => topicScripts.id),
  platform: varchar('platform', { length: 50 }).notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  status: scheduleStatusEnum('status').default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdBy: varchar('created_by', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const readingConversions = pgTable('reading_conversions', {
  id: uuid('id').defaultRandom().primaryKey(),
  scheduleId: uuid('schedule_id').references(() => publishSchedules.id).notNull(),
  views: bigint('views', { mode: 'number' }).default(0),
  reads: bigint('reads', { mode: 'number' }).default(0),
  shares: bigint('shares', { mode: 'number' }).default(0),
  comments: bigint('comments', { mode: 'number' }).default(0),
  conversionRate: varchar('conversion_rate', { length: 10 }).default('0'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const exceptions = pgTable('exceptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  scheduleId: uuid('schedule_id').references(() => publishSchedules.id).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  description: text('description'),
  status: exceptionStatusEnum('status').default('open').notNull(),
  handler: varchar('handler', { length: 100 }),
  handledAt: timestamp('handled_at', { withTimezone: true }),
  closeExplanation: text('close_explanation'),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  details: jsonb('details'),
  operator: varchar('operator', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const materialRelations = relations(materials, ({ many }) => ({
  materialTags: many(materialTags),
  topicScripts: many(topicScripts),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  materialTags: many(materialTags),
}));

export const materialTagRelations = relations(materialTags, ({ one }) => ({
  material: one(materials, { fields: [materialTags.materialId], references: [materials.id] }),
  tag: one(tags, { fields: [materialTags.tagId], references: [tags.id] }),
}));

export const topicScriptRelations = relations(topicScripts, ({ one, many }) => ({
  material: one(materials, { fields: [topicScripts.materialId], references: [materials.id] }),
  schedules: many(publishSchedules),
}));

export const publishScheduleRelations = relations(publishSchedules, ({ one, many }) => ({
  script: one(topicScripts, { fields: [publishSchedules.scriptId], references: [topicScripts.id] }),
  conversions: many(readingConversions),
  exceptions: many(exceptions),
}));

export const readingConversionRelations = relations(readingConversions, ({ one }) => ({
  schedule: one(publishSchedules, { fields: [readingConversions.scheduleId], references: [publishSchedules.id] }),
}));

export const exceptionRelations = relations(exceptions, ({ one }) => ({
  schedule: one(publishSchedules, { fields: [exceptions.scheduleId], references: [publishSchedules.id] }),
}));
