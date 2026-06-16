import { pgTable, pgEnum, uuid, varchar, text, integer, timestamp, date, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['supervisor', 'editor', 'shooter', 'cutter']);
export const materialTypeEnum = pgEnum('material_type', ['image', 'video', 'document', 'audio']);
export const reuseTargetTypeEnum = pgEnum('reuse_target_type', ['topic', 'task', 'schedule']);
export const topicStatusEnum = pgEnum('topic_status', ['draft', 'pending_approval', 'approved', 'in_production', 'published', 'archived']);
export const taskTypeEnum = pgEnum('task_type', ['shooting', 'editing']);
export const taskStatusEnum = pgEnum('task_status', ['assigned', 'in_progress', 'submitted', 'reviewing', 'completed']);
export const scheduleStatusEnum = pgEnum('schedule_status', ['scheduled', 'published', 'cancelled']);
export const anomalySeverityEnum = pgEnum('anomaly_severity', ['low', 'medium', 'high']);
export const anomalyStatusEnum = pgEnum('anomaly_status', ['open', 'investigating', 'resolving', 'closed']);
export const refTypeEnum = pgEnum('ref_type', ['material', 'task', 'schedule']);

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 100 }).notNull(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	role: userRoleEnum('role').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const tags = pgTable('tags', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 50 }).notNull(),
	category: varchar('category', { length: 50 }).notNull().default('general')
});

export const materials = pgTable('materials', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: varchar('title', { length: 255 }).notNull(),
	type: materialTypeEnum('type').notNull(),
	fileUrl: text('file_url').notNull(),
	fileSize: integer('file_size').notNull().default(0),
	uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	typeIdx: index('idx_materials_type').on(table.type),
	uploadedByIdx: index('idx_materials_uploaded_by').on(table.uploadedBy)
}));

export const materialTags = pgTable('material_tags', {
	materialId: uuid('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
	tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' })
}, (table) => ({
	pk: primaryKey({ columns: [table.materialId, table.tagId] })
}));

export const materialReuse = pgTable('material_reuse', {
	id: uuid('id').primaryKey().defaultRandom(),
	materialId: uuid('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
	targetType: reuseTargetTypeEnum('target_type').notNull(),
	targetId: uuid('target_id').notNull(),
	usedBy: uuid('used_by').notNull().references(() => users.id),
	usedAt: timestamp('used_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	materialIdIdx: index('idx_material_reuse_material_id').on(table.materialId)
}));

export const topics = pgTable('topics', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description').notNull(),
	status: topicStatusEnum('status').notNull().default('draft'),
	createdBy: uuid('created_by').notNull().references(() => users.id),
	approvedBy: uuid('approved_by').references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	statusIdx: index('idx_topics_status').on(table.status),
	createdByIdx: index('idx_topics_created_by').on(table.createdBy)
}));

export const topicMaterials = pgTable('topic_materials', {
	topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
	materialId: uuid('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' })
}, (table) => ({
	pk: primaryKey({ columns: [table.topicId, table.materialId] })
}));

export const scripts = pgTable('scripts', {
	id: uuid('id').primaryKey().defaultRandom(),
	topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
	content: text('content').notNull(),
	version: integer('version').notNull().default(1),
	createdBy: uuid('created_by').notNull().references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	topicIdIdx: index('idx_scripts_topic_id').on(table.topicId)
}));

export const sourceRecords = pgTable('source_records', {
	id: uuid('id').primaryKey().defaultRandom(),
	topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
	createdBy: uuid('created_by').notNull().references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	supplementaryNotes: text('supplementary_notes').notNull().default('')
}, (table) => ({
	topicIdIdx: index('idx_source_records_topic_id').on(table.topicId)
}));

export const sourceRecordReferences = pgTable('source_record_references', {
	id: uuid('id').primaryKey().defaultRandom(),
	sourceRecordId: uuid('source_record_id').notNull().references(() => sourceRecords.id, { onDelete: 'cascade' }),
	refType: refTypeEnum('ref_type').notNull(),
	refId: uuid('ref_id').notNull(),
	refLabel: varchar('ref_label', { length: 255 }).notNull()
});

export const tasks = pgTable('tasks', {
	id: uuid('id').primaryKey().defaultRandom(),
	topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
	type: taskTypeEnum('type').notNull(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description').notNull(),
	status: taskStatusEnum('status').notNull().default('assigned'),
	assigneeId: uuid('assignee_id').notNull().references(() => users.id),
	deadline: date('deadline').notNull(),
	createdBy: uuid('created_by').notNull().references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	topicIdIdx: index('idx_tasks_topic_id').on(table.topicId),
	assigneeIdIdx: index('idx_tasks_assignee_id').on(table.assigneeId),
	statusIdx: index('idx_tasks_status').on(table.status),
	typeIdx: index('idx_tasks_type').on(table.type)
}));

export const deliverables = pgTable('deliverables', {
	id: uuid('id').primaryKey().defaultRandom(),
	taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
	fileUrl: text('file_url').notNull(),
	fileType: varchar('file_type', { length: 20 }).notNull(),
	submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
	note: text('note').notNull().default('')
});

export const schedules = pgTable('schedules', {
	id: uuid('id').primaryKey().defaultRandom(),
	topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
	platform: varchar('platform', { length: 50 }).notNull(),
	accountName: varchar('account_name', { length: 100 }).notNull(),
	publishDate: date('publish_date').notNull(),
	publishTime: varchar('publish_time', { length: 10 }).notNull().default('09:00'),
	status: scheduleStatusEnum('status').notNull().default('scheduled'),
	supplementaryNotes: text('supplementary_notes').notNull().default(''),
	createdBy: uuid('created_by').notNull().references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	topicIdIdx: index('idx_schedules_topic_id').on(table.topicId),
	publishDateIdx: index('idx_schedules_publish_date').on(table.publishDate)
}));

export const anomalies = pgTable('anomalies', {
	id: uuid('id').primaryKey().defaultRandom(),
	topicId: uuid('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
	type: varchar('type', { length: 30 }).notNull().default('version_conflict'),
	severity: anomalySeverityEnum('severity').notNull().default('medium'),
	description: text('description').notNull(),
	status: anomalyStatusEnum('status').notNull().default('open'),
	createdBy: uuid('created_by').notNull().references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	closedBy: uuid('closed_by').references(() => users.id),
	closedAt: timestamp('closed_at', { withTimezone: true }),
	closureNote: text('closure_note').notNull().default('')
}, (table) => ({
	topicIdIdx: index('idx_anomalies_topic_id').on(table.topicId),
	statusIdx: index('idx_anomalies_status').on(table.status)
}));

export const usersRelations = relations(users, ({ many }) => ({
	materials: many(materials),
	materialReuses: many(materialReuse),
	topics: many(topics, { relationName: 'topicCreator' }),
	approvedTopics: many(topics, { relationName: 'topicApprover' }),
	scripts: many(scripts),
	sourceRecords: many(sourceRecords),
	tasks: many(tasks, { relationName: 'taskCreator' }),
	assignedTasks: many(tasks, { relationName: 'taskAssignee' }),
	schedules: many(schedules),
	anomalies: many(anomalies, { relationName: 'anomalyCreator' }),
	closedAnomalies: many(anomalies, { relationName: 'anomalyCloser' })
}));

export const tagsRelations = relations(tags, ({ many }) => ({
	materialTags: many(materialTags)
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
	uploadedBy: one(users, {
		fields: [materials.uploadedBy],
		references: [users.id],
		relationName: 'materialUploader'
	}),
	materialTags: many(materialTags),
	materialReuses: many(materialReuse),
	topicMaterials: many(topicMaterials)
}));

export const materialTagsRelations = relations(materialTags, ({ one }) => ({
	material: one(materials, {
		fields: [materialTags.materialId],
		references: [materials.id]
	}),
	tag: one(tags, {
		fields: [materialTags.tagId],
		references: [tags.id]
	})
}));

export const materialReuseRelations = relations(materialReuse, ({ one }) => ({
	material: one(materials, {
		fields: [materialReuse.materialId],
		references: [materials.id]
	}),
	usedBy: one(users, {
		fields: [materialReuse.usedBy],
		references: [users.id],
		relationName: 'reuseUser'
	})
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [topics.createdBy],
		references: [users.id],
		relationName: 'topicCreator'
	}),
	approvedBy: one(users, {
		fields: [topics.approvedBy],
		references: [users.id],
		relationName: 'topicApprover'
	}),
	topicMaterials: many(topicMaterials),
	scripts: many(scripts),
	sourceRecords: many(sourceRecords),
	tasks: many(tasks),
	schedules: many(schedules),
	anomalies: many(anomalies)
}));

export const topicMaterialsRelations = relations(topicMaterials, ({ one }) => ({
	topic: one(topics, {
		fields: [topicMaterials.topicId],
		references: [topics.id]
	}),
	material: one(materials, {
		fields: [topicMaterials.materialId],
		references: [materials.id]
	})
}));

export const scriptsRelations = relations(scripts, ({ one }) => ({
	topic: one(topics, {
		fields: [scripts.topicId],
		references: [topics.id]
	}),
	createdBy: one(users, {
		fields: [scripts.createdBy],
		references: [users.id],
		relationName: 'scriptCreator'
	})
}));

export const sourceRecordsRelations = relations(sourceRecords, ({ one, many }) => ({
	topic: one(topics, {
		fields: [sourceRecords.topicId],
		references: [topics.id]
	}),
	createdBy: one(users, {
		fields: [sourceRecords.createdBy],
		references: [users.id],
		relationName: 'sourceRecordCreator'
	}),
	references: many(sourceRecordReferences)
}));

export const sourceRecordReferencesRelations = relations(sourceRecordReferences, ({ one }) => ({
	sourceRecord: one(sourceRecords, {
		fields: [sourceRecordReferences.sourceRecordId],
		references: [sourceRecords.id]
	})
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
	topic: one(topics, {
		fields: [tasks.topicId],
		references: [topics.id]
	}),
	assignee: one(users, {
		fields: [tasks.assigneeId],
		references: [users.id],
		relationName: 'taskAssignee'
	}),
	createdBy: one(users, {
		fields: [tasks.createdBy],
		references: [users.id],
		relationName: 'taskCreator'
	}),
	deliverables: many(deliverables)
}));

export const deliverablesRelations = relations(deliverables, ({ one }) => ({
	task: one(tasks, {
		fields: [deliverables.taskId],
		references: [tasks.id]
	})
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
	topic: one(topics, {
		fields: [schedules.topicId],
		references: [topics.id]
	}),
	createdBy: one(users, {
		fields: [schedules.createdBy],
		references: [users.id],
		relationName: 'scheduleCreator'
	})
}));

export const anomaliesRelations = relations(anomalies, ({ one }) => ({
	topic: one(topics, {
		fields: [anomalies.topicId],
		references: [topics.id]
	}),
	createdBy: one(users, {
		fields: [anomalies.createdBy],
		references: [users.id],
		relationName: 'anomalyCreator'
	}),
	closedBy: one(users, {
		fields: [anomalies.closedBy],
		references: [users.id],
		relationName: 'anomalyCloser'
	})
}));
