import {
	pgTable,
	serial,
	text,
	timestamp,
	boolean,
	integer,
	varchar,
	jsonb,
	uuid,
	date,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const trainers = pgTable('trainers', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 100 }).notNull(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	team: varchar('team', { length: 100 }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull()
});

export const emails = pgTable('emails', {
	id: serial('id').primaryKey(),
	uuid: uuid('uuid').defaultRandom().unique().notNull(),
	subject: varchar('subject', { length: 500 }).notNull(),
	recipient: varchar('recipient', { length: 255 }),
	sender: varchar('sender', { length: 255 }),
	content: text('content').notNull(),
	status: varchar('status', { length: 20 }).notNull().default('draft'),
	trainerId: integer('trainer_id').references(() => trainers.id),
	riskLevel: varchar('risk_level', { length: 20 }).default('low'),
	needsReview: boolean('needs_review').default(false),
	reviewed: boolean('reviewed').default(false),
	reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
	reviewedBy: varchar('reviewed_by', { length: 100 }),
	sentAt: timestamp('sent_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull()
});

export const emailVersions = pgTable('email_versions', {
	id: serial('id').primaryKey(),
	emailId: integer('email_id')
		.references(() => emails.id, { onDelete: 'cascade' })
		.notNull(),
	version: integer('version').notNull(),
	subject: varchar('subject', { length: 500 }).notNull(),
	content: text('content').notNull(),
	changeNote: varchar('change_note', { length: 500 }),
	createdBy: varchar('created_by', { length: 100 }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull()
});

export const riskSamples = pgTable('risk_samples', {
	id: serial('id').primaryKey(),
	emailId: integer('email_id')
		.references(() => emails.id, { onDelete: 'cascade' })
		.notNull(),
	emailVersionId: integer('email_version_id').references(() => emailVersions.id),
	riskType: varchar('risk_type', { length: 50 }).notNull(),
	description: text('description').notNull(),
	severity: varchar('severity', { length: 20 }).notNull().default('medium'),
	location: varchar('location', { length: 200 }),
	markedBy: varchar('marked_by', { length: 100 }),
	resolved: boolean('resolved').default(false),
	resolvedAt: timestamp('resolved_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull()
});

export const reviews = pgTable('reviews', {
	id: serial('id').primaryKey(),
	emailId: integer('email_id')
		.references(() => emails.id, { onDelete: 'cascade' })
		.notNull(),
	reviewer: varchar('reviewer', { length: 100 }).notNull(),
	comment: text('comment'),
	verdict: varchar('verdict', { length: 20 }).notNull().default('pending'),
	assignedAt: timestamp('assigned_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	dueDate: date('due_date')
});

export const referenceSources = pgTable('reference_sources', {
	id: serial('id').primaryKey(),
	title: varchar('title', { length: 500 }).notNull(),
	category: varchar('category', { length: 100 }),
	url: varchar('url', { length: 1000 }),
	source: varchar('source', { length: 200 }),
	publishedAt: date('published_at'),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull()
});

export const knowledgeBase = pgTable('knowledge_base', {
	id: serial('id').primaryKey(),
	category: varchar('category', { length: 100 }).notNull(),
	title: varchar('title', { length: 500 }).notNull(),
	content: text('content').notNull(),
	referenceSourceId: integer('reference_source_id').references(() => referenceSources.id),
	tags: varchar('tags', { length: 500 }),
	active: boolean('active').default(true),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull()
});

export const forbiddenWords = pgTable('forbidden_words', {
	id: serial('id').primaryKey(),
	word: varchar('word', { length: 200 }).notNull(),
	category: varchar('category', { length: 100 }),
	severity: varchar('severity', { length: 20 }).notNull().default('medium'),
	description: text('description'),
	active: boolean('active').default(true),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull()
});

export const missingReasons = pgTable('missing_reasons', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 100 }).notNull(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull()
});

export const hitRates = pgTable('hit_rates', {
	id: serial('id').primaryKey(),
	emailId: integer('email_id')
		.references(() => emails.id, { onDelete: 'cascade' })
		.notNull(),
	emailVersionId: integer('email_version_id').references(() => emailVersions.id),
	knowledgeId: integer('knowledge_id').references(() => knowledgeBase.id),
	forbiddenWordId: integer('forbidden_word_id').references(() => forbiddenWords.id),
	trainerId: integer('trainer_id').references(() => trainers.id),
	hitType: varchar('hit_type', { length: 20 }).notNull(),
	matchText: varchar('match_text', { length: 500 }),
	missingReasonId: integer('missing_reason_id').references(() => missingReasons.id),
	hitDate: date('hit_date').notNull().default(sql`CURRENT_DATE`),
	count: integer('count').notNull().default(1),
	createdAt: timestamp('created_at', { withTimezone: true })
		.default(sql`now()`)
		.notNull()
}, (table) => ({
	unq: uniqueIndex('hit_rates_unique').on(
		table.emailId,
		table.emailVersionId,
		table.knowledgeId,
		table.forbiddenWordId,
		table.hitType,
		table.hitDate
	)
}));

export type Trainer = typeof trainers.$inferSelect;
export type NewTrainer = typeof trainers.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type EmailVersion = typeof emailVersions.$inferSelect;
export type NewEmailVersion = typeof emailVersions.$inferInsert;
export type RiskSample = typeof riskSamples.$inferSelect;
export type NewRiskSample = typeof riskSamples.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type ReferenceSource = typeof referenceSources.$inferSelect;
export type NewReferenceSource = typeof referenceSources.$inferInsert;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type NewKnowledgeBase = typeof knowledgeBase.$inferInsert;
export type ForbiddenWord = typeof forbiddenWords.$inferSelect;
export type NewForbiddenWord = typeof forbiddenWords.$inferInsert;
export type MissingReason = typeof missingReasons.$inferSelect;
export type NewMissingReason = typeof missingReasons.$inferInsert;
export type HitRate = typeof hitRates.$inferSelect;
export type NewHitRate = typeof hitRates.$inferInsert;
