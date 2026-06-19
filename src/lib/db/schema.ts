import { pgTable, pgEnum, uuid, varchar, text, integer, boolean, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ========== 枚举类型 ==========

export const inventoryLogTypeEnum = pgEnum('inventory_log_type', [
	'manual_adjust',
	'order_deduct',
	'reserve_release',
	'reserve_hold'
]);

export const reminderMethodEnum = pgEnum('reminder_method', ['sms', 'wechat', 'app_push']);

export const reminderStatusEnum = pgEnum('reminder_status', ['sent', 'delivered', 'failed']);

export const disputeCategoryEnum = pgEnum('dispute_category', [
	'assembly',
	'review',
	'driver_vehicle',
	'other'
]);

export const todoSourceEnum = pgEnum('todo_source', ['escalation', 'manual']);

export const todoUrgencyEnum = pgEnum('todo_urgency', ['high', 'medium', 'low']);

export const todoStatusEnum = pgEnum('todo_status', ['pending', 'in_progress', 'completed']);

// ========== 数据表 ==========

export const tourRoutes = pgTable('tour_routes', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	name: varchar('name', { length: 200 }).notNull(),
	city: varchar('city', { length: 100 }).notNull(),
	description: text('description'),
	status: varchar('status', { length: 20 }).notNull().default('active'),
	meetingPoint: varchar('meeting_point', { length: 500 }),
	duration: integer('duration').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const itineraries = pgTable('itineraries', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	routeId: uuid('route_id')
		.notNull()
		.references(() => tourRoutes.id, { onDelete: 'cascade' }),
	version: integer('version').notNull().default(1),
	departureTime: timestamp('departure_time', { withTimezone: true }).notNull(),
	guide: varchar('guide', { length: 200 }),
	content: jsonb('content').notNull().default({}),
	changeReason: text('change_reason').notNull(),
	operatorId: varchar('operator_id', { length: 100 }).notNull(),
	operatorName: varchar('operator_name', { length: 200 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`)
}, (table) => [
	uniqueIndex('itineraries_route_id_version_unique').on(table.routeId, table.version)
]);

export const inventories = pgTable('inventories', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	routeId: uuid('route_id')
		.unique()
		.notNull()
		.references(() => tourRoutes.id, { onDelete: 'cascade' }),
	available: integer('available').notNull().default(0),
	sold: integer('sold').notNull().default(0),
	reserved: integer('reserved').notNull().default(0),
	total: integer('total').notNull().default(0),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const inventoryLogs = pgTable('inventory_logs', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	routeId: uuid('route_id')
		.notNull()
		.references(() => tourRoutes.id, { onDelete: 'cascade' }),
	type: inventoryLogTypeEnum('type').notNull(),
	beforeValue: integer('before_value').notNull(),
	afterValue: integer('after_value').notNull(),
	quantity: integer('quantity').notNull(),
	reason: text('reason').notNull(),
	operatorId: varchar('operator_id', { length: 100 }).notNull(),
	operatorName: varchar('operator_name', { length: 200 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const assemblyReminders = pgTable('assembly_reminders', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	itineraryId: uuid('itinerary_id')
		.notNull()
		.references(() => itineraries.id, { onDelete: 'cascade' }),
	sendTime: timestamp('send_time', { withTimezone: true }).notNull(),
	method: reminderMethodEnum('method').notNull(),
	recipient: varchar('recipient', { length: 200 }).notNull(),
	status: reminderStatusEnum('status').notNull().default('sent'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const touristReviews = pgTable('tourist_reviews', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	itineraryId: uuid('itinerary_id')
		.notNull()
		.references(() => itineraries.id, { onDelete: 'cascade' }),
	touristName: varchar('tourist_name', { length: 200 }).notNull(),
	rating: integer('rating').notNull(),
	content: text('content').notNull(),
	reply: text('reply'),
	processingNote: text('processing_note'),
	operatorId: varchar('operator_id', { length: 100 }),
	operatorName: varchar('operator_name', { length: 200 }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const driverVehicleAssignments = pgTable('driver_vehicle_assignments', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	itineraryId: uuid('itinerary_id')
		.notNull()
		.references(() => itineraries.id, { onDelete: 'cascade' }),
	driverName: varchar('driver_name', { length: 200 }).notNull(),
	vehiclePlate: varchar('vehicle_plate', { length: 50 }).notNull(),
	assignedBy: varchar('assigned_by', { length: 100 }).notNull(),
	assignedByName: varchar('assigned_by_name', { length: 200 }).notNull(),
	changeReason: text('change_reason').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const disputeNotes = pgTable('dispute_notes', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	itineraryId: uuid('itinerary_id')
		.notNull()
		.references(() => itineraries.id, { onDelete: 'cascade' }),
	category: disputeCategoryEnum('category').notNull(),
	content: text('content').notNull(),
	evidence: text('evidence').notNull(),
	operatorId: varchar('operator_id', { length: 100 }).notNull(),
	operatorName: varchar('operator_name', { length: 200 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const reminderRules = pgTable('reminder_rules', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	name: varchar('name', { length: 200 }).notNull(),
	enabled: boolean('enabled').notNull().default(true),
	condition: jsonb('condition').notNull().default({}),
	action: jsonb('action').notNull().default({}),
	operatorId: varchar('operator_id', { length: 100 }).notNull(),
	operatorName: varchar('operator_name', { length: 200 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const todoItems = pgTable('todo_items', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	source: todoSourceEnum('source').notNull().default('escalation'),
	sourceRuleId: uuid('source_rule_id').references(() => reminderRules.id),
	itineraryId: uuid('itinerary_id').references(() => itineraries.id, { onDelete: 'set null' }),
	routeId: uuid('route_id').references(() => tourRoutes.id, { onDelete: 'set null' }),
	urgency: todoUrgencyEnum('urgency').notNull().default('medium'),
	description: text('description').notNull(),
	status: todoStatusEnum('status').notNull().default('pending'),
	result: text('result'),
	evidence: text('evidence'),
	operatorId: varchar('operator_id', { length: 100 }),
	operatorName: varchar('operator_name', { length: 200 }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	completedAt: timestamp('completed_at', { withTimezone: true })
});
